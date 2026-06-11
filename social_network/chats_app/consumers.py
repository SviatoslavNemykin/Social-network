import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone  # Додали для відображення точного часу відправки
from .models import Message
from django.utils.timezone import now

class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.chat_id = self.scope["url_route"]['kwargs']['chat_id']
        self.room_group_name = f"chat_{self.chat_id}"

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
        print(f"Підключення до чату {self.room_group_name} було успішно встановлено")

    async def disconnect(self, close_code):
        # ДОПИСАНО: Обов'язково видаляємо канал із групи при закритті вкладки/браузера
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        print(f"Користувач відключився від чату {self.room_group_name}")

    async def receive(self, text_data):
        dict_data = json.loads(text_data)
        
        # ВИПРАВЛЕНО: Беремо або messageText, або message, щоб закрити конфлікт імен із JS
        message_text = dict_data.get('messageText') or dict_data.get('message', '')
        message_text = message_text.strip()
        
        if message_text:
            await self.save_message(message_text)
            avatar_url = await self.get_user_avatar(self.scope['user'])
            
            user = self.scope['user']
            sender_display_name = user.username if user.username else user.email
            current_time = timezone.localtime(timezone.now()).strftime('%H:%M')
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_chat_message',
                    'message_text': message_text,
                    'sender_email': user.email,
                    'sender_name': sender_display_name,
                    'avatar': avatar_url,
                    'time': current_time  # Передаємо час у групу
                }
            )

    async def send_chat_message(self, event):
        # ВИПРАВЛЕНО: Додано ключ 'message' та 'time', щоб JS на фронтенді міг їх прочитати
        await self.send(text_data=json.dumps({
            'action': 'chat_message',
            'message_text': event['message_text'],
            'message': event['message_text'],  # Дубликат для JS (data.message)
            'sender_email': event['sender_email'],
            'sender_name': event['sender_name'],
            'avatar': event['avatar'],
            'time': event.get('time', now().isoformat())       # Відправляємо час у браузер
        }))

    @database_sync_to_async
    def save_message(self, text):
        user = self.scope['user']
        return Message.objects.create(chat_id=self.chat_id, sender=user, text=text)

    @database_sync_to_async
    def get_user_avatar(self, user):
        if hasattr(user, 'avatar') and user.avatar:
            return user.avatar.url
        return ""