import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import Chat, Message
from django.db.models import Max # Обязательно добавь этот импорт в самый верх файла consumers.py

# =====================================================================
# CONSUMER 1: УПРАВЛЕНИЕ НЕПРОЧИТАННЫМИ (С СОРТИРОВКОЙ ПО НОВИЗНЕ)
# =====================================================================
class UnreadConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_anonymous:
            await self.close()
            return
            
        self.group_name = f'unread_{self.user.id}' 
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send_unread_data()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        
    async def receive(self, text_data):
        await self.send_unread_data()

    async def unread_update(self, event):
        await self.send_unread_data()

    async def send_unread_data(self):
        data = await self.get_unread_data()
        await self.send(text_data=json.dumps(data))
    
    @database_sync_to_async
    def get_unread_data(self):
        personal_total = 0
        group_total = 0
        chat_data = []
        
        # Находим чаты пользователя и аннотируем их датой последнего сообщения, 
        # затем сортируем от самых новых к самым старым (-last_message_time)
        chats = Chat.objects.filter(users=self.user).annotate(
            last_message_time=Max('messages__id')  # Сортируем по ID последнего сообщения (чем больше ID, тем оно новее)
        ).order_by('-last_message_time')

        for chat in chats:
            unread = chat.messages.exclude(sender=self.user).exclude(readers=self.user).count()
            
            if chat.is_group:
                group_total += unread
            else:
                personal_total += unread
            
            # Получаем текст и время самого последнего сообщения в этом чате
            last_msg_obj = chat.messages.order_by('-id').first()
            last_msg_text = last_msg_obj.text if last_msg_obj else "Натисніть, щоб відкрити чат"
            
            # Форматируем время локально
            last_msg_time = ""
            if last_msg_obj:
                last_msg_time = timezone.localtime(last_msg_obj.created_at).strftime('%H:%M') if hasattr(last_msg_obj, 'created_at') else "10:45"
            else:
                last_msg_time = "10:45"
            
            chat_data.append({
                "id": chat.id,
                "unread": unread,
                "last": last_msg_text,
                "time": last_msg_time
            })

        return {
            "personal_total": personal_total,
            "group_total": group_total,
            "total": personal_total + group_total,
            "chats": chat_data
        }

# =====================================================================
# CONSUMER 2: ОСНОВНОЙ ЧАТ (ОТПРАВКА СООБЩЕНИЙ И АВТО-ПРОЧТЕНИЕ)
# =====================================================================
class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.chat_id = self.scope["url_route"]['kwargs']['chat_id']
        self.room_group_name = f"chat_{self.chat_id}"
        self.user = self.scope['user']

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        await self.send(
            text_data=json.dumps(
                {
                    'action': 'connection_confirmation',
                    'message': 'Підключення до чату було успішно встановлено'
                }
            )
        )
        
        # Когда пользователь открывает комнату, помечаем все сообщения в ней как прочитанные
        await self.mark_all_messages_read()
        
        # Сразу отправляем обновление на счетчики текущего пользователя
        await self.channel_layer.group_send(
            f'unread_{self.user.id}', 
            {'type': 'unread_update'}
        )
        
        print(f"Підключення до чату {self.room_group_name} було успішно встановлено")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        print(f"Користувач відключився від чату {self.room_group_name}")

    async def receive(self, text_data):
        dict_data = json.loads(text_data)
        
        message_text = dict_data.get('messageText') or dict_data.get('message', '')
        message_text = message_text.strip()
        
        if message_text:
            # Сохраняем и получаем ID созданного сообщения
            message_obj = await self.save_message(message_text)
            avatar_url = await self.get_user_avatar(self.user)
            
            sender_display_name = self.user.username if self.user.username else self.user.email
            current_time = timezone.localtime(timezone.now()).strftime('%H:%M')
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_chat_message',
                    'id': message_obj.id,  # Передаем ID для трекинга прочтения «на лету»
                    'message_text': message_text,
                    'sender_email': self.user.email,
                    'sender_name': sender_display_name,
                    'avatar': avatar_url,
                    'time': current_time,
                    'images': []  # Если логика картинок идет отдельно, оставляем пустым
                }
            )

        # Уведомляем ВСЕХ участников чата о том, что структура непрочитанных изменилась
        await self.notify_unread_chat()

    async def send_chat_message(self, event):
        # Если у других участников этот вебсокет чата прямо сейчас открыт,
        # сообщение для них зачитывается как прочитанное мгновенно.
        await self.mark_single_message_read(event.get("id"))
        
        # Заставляем UnreadConsumer обновить глобальные счетчики групп/контактов
        await self.channel_layer.group_send(
            f'unread_{self.user.id}', 
            {'type': 'unread_update'}
        )

        await self.send(text_data=json.dumps({
            'action': 'chat_message',
            'message_text': event.get('message_text', ''),
            'sender_email': event.get('sender_email', ''),
            'sender_name': event.get('sender_name', ''),
            'avatar': event.get('avatar', ''),
            'time': event.get('time', ''),
            'images': event.get('images', []), 
        }))

    @database_sync_to_async
    def save_message(self, text):
        # Создаем сообщение и сразу добавляем автора в список прочитавших (readers)
        msg = Message.objects.create(chat_id=self.chat_id, sender=self.user, text=text)
        msg.readers.add(self.user)
        return msg

    @database_sync_to_async
    def get_user_avatar(self, user):
        if hasattr(user, 'avatar') and user.avatar:
            return user.avatar.url
        return ""

    async def notify_unread_chat(self):
        user_ids = await self.get_chat_users_ids()
        for uid in user_ids:
            await self.channel_layer.group_send(
                f'unread_{uid}', 
                {'type': 'unread_update'}
            )

    @database_sync_to_async
    def get_chat_users_ids(self):
        return list(Chat.objects.get(id=self.chat_id).users.values_list("id", flat=True))
    
    @database_sync_to_async
    def mark_single_message_read(self, message_id):
        if not message_id:
            return
        try:
            msg = Message.objects.get(id=message_id)
            if msg.sender_id != self.user.id:
                msg.readers.add(self.user)
        except Message.DoesNotExist:
            pass

    @database_sync_to_async
    def mark_all_messages_read(self):
        unread_messages = Message.objects.filter(chat_id=self.chat_id).exclude(sender=self.user)
        for msg in unread_messages:
            msg.readers.add(self.user)


# =====================================================================
# CONSUMER 3: ОНЛАЙН СТАТУСЫ (СТАТИЧЕСКИЙ ГЛОБАЛЬНЫЙ МАССИВ)
# =====================================================================
GLOBAL_ONLINE_USERS = set()

class OnlineStatusConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = self.scope["user"]
        
        if self.user.is_anonymous:
            await self.close()
            return

        self.user_id = str(self.user.id)
        self.group_name = "online_users"
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        
        GLOBAL_ONLINE_USERS.add(self.user_id)

        for uid in list(GLOBAL_ONLINE_USERS):
            await self.send_status(uid, "online")

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "online_status",
                "user_id": self.user_id,
                "status": "online"
            }
        )

    async def disconnect(self, code):
        GLOBAL_ONLINE_USERS.discard(self.user_id)
        
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "online_status",
                "user_id": self.user_id,
                "status": "offline"
            }
        )

        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def online_status(self, event):
        await self.send_status(event["user_id"], event["status"])

    async def send_status(self, user_id, status):
        await self.send(text_data=json.dumps({
            "user_id": user_id,
            "status": status
        }))