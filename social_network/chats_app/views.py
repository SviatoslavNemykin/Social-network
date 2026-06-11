import json
from django.shortcuts import redirect, render
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import View, TemplateView
from django.urls import reverse_lazy
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from friends_app.services.friend_quries import get_friends
from .models import Chat
from .services.chat_actions import get_or_create_chat

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
        
        # Групові чати (ДОДАНО)
        context["group_chats"] = Chat.objects.filter(
            users=self.request.user,
            is_group=True
        ).order_by("id")
        
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
            messages_queryset = chat_obj.messages.all().order_by('created_at')
            
            messages_list = []
            for msg in messages_queryset:
                sender_avatar = msg.sender.avatar.url if msg.sender and hasattr(msg.sender, 'avatar') and msg.sender.avatar else ""
                sender_display_name = "Система"
                if msg.sender:
                    sender_display_name = msg.sender.username if msg.sender.username else msg.sender.email

                messages_list.append({
                    'sender_email': msg.sender.email if msg.sender else "",
                    'sender_name': sender_display_name,
                    'avatar': sender_avatar,
                    'text': msg.text,
                    # ВАЖНО: Передаем полную дату и время в формате ISO 8601
                    'time': msg.created_at.isoformat() 
                })
            
            return JsonResponse({
                "success": True,
                "chat_id": chat_id,
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