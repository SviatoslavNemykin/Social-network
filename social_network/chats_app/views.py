import json
from django.shortcuts import redirect, render
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import View, TemplateView
from django.urls import reverse_lazy
from django.contrib.auth import get_user_model
from django.http import JsonResponse, HttpRequest
from friends_app.services.friend_quries import get_friends
from .models import Chat, Message, MessageImage
from channels.layers import get_channel_layer
from django.utils import timezone
from .services.chat_actions import get_or_create_chat
from asgiref.sync import async_to_sync
from django.shortcuts import get_object_or_404

User = get_user_model()

class ChatsView(LoginRequiredMixin, TemplateView):
    login_url = 'auth'
    template_name = 'chats_app/chats.html'
    
    def get(self, request, *args, **kwargs):
        if request.user.username == ' ' or request.user.username is None:
            return redirect('home')
        return super().get(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["friends"] = get_friends(self.request.user)
        
        # Персональні чати
        context["personal_chats"] = Chat.objects.filter(
            users=self.request.user,
            is_group=False
        ).order_by("id")
        
        # Групові чати
        context["group_chats"] = Chat.objects.filter(
            users=self.request.user,
            is_group=True
        ).order_by("id")
        
        # --- ЛОГИКА ДЛЯ АВТООТКРЫТИЯ ЧАТА ПО ?id=10 ---
        chat_id = self.request.GET.get('id')
        if chat_id:
            try:
                # Ищем чат по ID и сразу проверяем, состоит ли в нем текущий юзер (безопасность!)
                chat_obj = Chat.objects.prefetch_related('users').get(id=chat_id, users=self.request.user)
                
                context["active_chat_id"] = chat_obj.id
                
                if chat_obj.is_group:
                    context["active_chat_title"] = chat_obj.name  # Имя группы
                    context["active_chat_type"] = "group"
                else:
                    # Для личного чата ищем второго участника, чтобы взять его юзернейм как заголовок
                    other_user = chat_obj.users.exclude(id=self.request.user.id).first()
                    if other_user:
                        context["active_chat_title"] = other_user.first_name
                        context["active_chat_user_id"] = other_user.id
                    context["active_chat_type"] = "personal"
            except Chat.DoesNotExist:
                # Если чата нет или у юзера нет к нему доступа — просто ничего не делаем
                pass
        
        return context


class ChatWithView(LoginRequiredMixin, View):
    login_url = 'auth'

    def post(self, request, user_id, *args, **kwargs):
        response = get_or_create_chat(request, user_id)
        if response.status_code == 200:
            data = json.loads(response.content)
            return JsonResponse({"success": True, "chat_id": data.get("chat_id")})
        return response


# Нова View для отримання історії будь-якого чату за його ID
class ChatHistoryView(LoginRequiredMixin, View):
    def get(self, request, chat_id, *args, **kwargs):
        try:
            chat_obj = Chat.objects.get(id=chat_id, users=request.user)
            
            # Добавили prefetch_related('images'), чтобы Django доставал картинки за один запрос
            messages_queryset = chat_obj.messages.all().order_by('created_at').prefetch_related('images')
            
            messages_list = []
            for msg in messages_queryset:
                sender_avatar = msg.sender.avatar.url if msg.sender and hasattr(msg.sender, 'avatar') and msg.sender.avatar else ""
                sender_display_name = "Система"
                if msg.sender:
                    sender_display_name = msg.sender.username if msg.sender.username else msg.sender.email

                # ВЫТАСКИВАЕМ КАРТИНКИ: Собираем список URL для текущего сообщения
                image_urls = [img.image.url for img in msg.images.all()]

                messages_list.append({
                    'sender_email': msg.sender.email if msg.sender else "",
                    'sender_name': sender_display_name,
                    'avatar': sender_avatar,
                    'text': msg.text,
                    'time': msg.created_at.isoformat(),
                    'images': image_urls # ПЕРЕДАЕМ В JSON: Массив картинок для фронтенда
                })
            
            group_user_ids = list(chat_obj.users.values_list('id', flat=True))

            # Внутри класса ChatHistoryView, в самом конце блока try:
            return JsonResponse({
                "success": True,
                "chat_id": chat_id,
                "is_admin": chat_obj.admin == request.user,  # <-- ДОБАВИЛИ ЭТУ СТРОКУ
                "user_ids": group_user_ids,
                "history": messages_list
            })
        except Chat.DoesNotExist:
            return JsonResponse({"success": False, "error": "Chat not found"}, status=404)


# Створення групи з вашого сервісу
class CreateGroupView(LoginRequiredMixin, View):
    def post(self, request):
        name = request.POST.get("name", "").strip()
        user_ids = request.POST.getlist("users")

        if not name:
            return JsonResponse({'success': False, "error": "name_required"}, status=400)
        
        # Фільтруємо лише реальних друзів
        friend_ids = get_friends(request.user).filter(id__in=user_ids).values_list("id", flat=True)
        
        chat = Chat.objects.create(name=name, is_group=True, admin=request.user)
        chat.users.add(request.user)
        chat.users.add(*User.objects.filter(id__in=friend_ids))

        return JsonResponse({'success': True, 'chat_id': chat.id, "name": chat.name})
    

class MessageUploadView(LoginRequiredMixin, View):
    login_url = reverse_lazy("register_login_page")

    def post(self, request: HttpRequest, chat_id):
        if not Chat.objects.filter(id=chat_id, users=request.user).exists():
            return JsonResponse({"success": False}, status=403)
        
        text = request.POST.get("text", "").strip()
        images = request.FILES.getlist("images")

        if not text and not images:
            return JsonResponse({"success": False}, status=400)
        
        # Создаем сообщение
        message = Message.objects.create(chat_id=chat_id, sender=request.user, text=text)

        # Сохраняем все картинки
        for image in images:
            MessageImage.objects.create(message=message, image=image)

        image_urls = [img.image.url for img in message.images.all()]

        # Готовим данные для WebSocket рассылки (синхронизируем структуры полей с прошлым кодом)
        sender_avatar = request.user.avatar.url if hasattr(request.user, 'avatar') and request.user.avatar else ""
        sender_display_name = request.user.username if request.user.username else request.user.email
        
        # Находится внутри MessageUploadView -> def post
        channel_layer = get_channel_layer()

        async_to_sync(channel_layer.group_send)(
            f'chat_{chat_id}',
            {
                # 1. ВАЖНО: возвращаем имя обработчика, который написан в вашем consumers.py
                'type': 'send_chat_message', 
                
                # 2. Передаем полный совмещенный набор ключей для consumers.py и для chat.js
                'action': 'chat_message',
                'id': message.id,
                'text': message.text,
                'message': message.text,
                'message_text': message.text,
                'sender': request.user.email,
                'sender_email': request.user.email,
                'sender_name': sender_display_name,
                'avatar': sender_avatar,
                'created_at': timezone.localtime(message.created_at).isoformat(),
                'time': timezone.localtime(message.created_at).isoformat(),
                'images': image_urls
            }
        )

        return JsonResponse({'success': True})
    


# 1. Редактирование группы (только для админа)
class EditGroupView(LoginRequiredMixin, View):
    
    def get(self, request, chat_id):
        chat_obj = get_object_or_404(Chat, id=chat_id, users=request.user)
        
        if chat_obj.admin != request.user:
            return JsonResponse({"success": False, "error": "permission_denied"}, status=403)
            
        # 1. Список ТЕКУЩИХ участников группы (Исключаем себя!)
        current_users = []
        current_ids = set()
        
        # ДОБАВЛЕНО ОГРАНИЧЕНИЕ: .exclude(id=request.user.id)
        for u in chat_obj.users.exclude(id=request.user.id):
            current_ids.add(u.id)
            current_users.append({
                "id": u.id,
                "username": u.first_name if u.first_name else u.username  
            })
            
        # 2. ПОЛНЫЙ список друзей для добавления (Тоже исключаем себя на всякий случай)
        friends_queryset = get_friends(request.user).exclude(id=request.user.id)
        
        all_friends_list = []
        for friend in friends_queryset:
            all_friends_list.append({
                "id": friend.id,
                "first_name": friend.first_name if friend.first_name else friend.username,
                "is_member": friend.id in current_ids 
            })
            
        return JsonResponse({
            "success": True,
            "name": chat_obj.name,
            "users": current_users,      # Теперь здесь только другие участники
            "friends": all_friends_list   # И здесь только твои друзья без тебя
        })

    def post(self, request, chat_id):
        chat_obj = get_object_or_404(Chat, id=chat_id)
        
        if chat_obj.admin != request.user:
            return JsonResponse({"success": False, "error": "permission_denied"}, status=403)
        
        name = request.POST.get("name", "").strip()
        user_ids = request.POST.getlist("users") 

        if not name:
            return JsonResponse({"success": False, "error": "name_required"}, status=400)
            
        chat_obj.name = name
        chat_obj.save()
        
        # Процесс сохранения измененного списка
        if user_ids:
            user_ids = [int(uid) for uid in user_ids]
            
            # Валидируем только через реальных друзей
            valid_friend_ids = list(get_friends(request.user).filter(id__in=user_ids).values_list("id", flat=True))
            
            # ЖЕЛЕЗНОЕ ПРАВИЛО: Админ всегда возвращается в этот чат, 
            # независимо от того, что прислал фронтенд
            if request.user.id not in valid_friend_ids:
                valid_friend_ids.append(request.user.id)

            chat_obj.users.set(User.objects.filter(id__in=valid_friend_ids))
        else:
            # Если всех удалили из списка, в группе остается только сам админ
            chat_obj.users.set([request.user])

        return JsonResponse({"success": True, "name": chat_obj.name})
    


# 2. Выход из группы (для любого участника, кроме последнего админа)
class LeaveGroupView(LoginRequiredMixin, View):
    def post(self, request, chat_id):
        chat_obj = get_object_or_404(Chat, id=chat_id, users=request.user)
        
        # Если админ выходит, нужно либо передать права, либо удалить, если он один
        if chat_obj.admin == request.user:
            other_users = chat_obj.users.exclude(id=request.user.id)
            if other_users.exists():
                chat_obj.admin = other_users.first() # передаем первому попавшемуся
                chat_obj.save()
            else:
                chat_obj.delete() # если никого нет, удаляем чат
                return JsonResponse({"success": True, "action": "deleted"})
                
        chat_obj.users.remove(request.user)
        return JsonResponse({"success": True, "action": "left"})

# 3. Полное удаление чата (админом группы или для личных чатов)
class DeleteChatView(LoginRequiredMixin, View):
    def post(self, request, chat_id):
        chat_obj = get_object_or_404(Chat, id=chat_id, users=request.user)
        
        # Если это группа, удалять может только админ
        if chat_obj.is_group and chat_obj.admin != request.user:
            return JsonResponse({"success": False, "error": "permission_denied"}, status=403)
            
        chat_obj.delete()
        return JsonResponse({"success": True})