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
        context["personal_chats"] = Chat.objects.filter(
            users=self.request.user,
            is_group=False
        ).order_by("id")
        return context


class ChatWithView(LoginRequiredMixin, View):
    login_url = 'auth'

    def post(self, request, user_id, *args, **kwargs):
        response = get_or_create_chat(request, user_id)
        
        if response.status_code == 200:
            data = json.loads(response.content)
            chat_id = data.get("chat_id")
            
            if chat_id:
                chat_obj = Chat.objects.get(id=chat_id)
                messages_queryset = chat_obj.messages.all().order_by('created_at')
                
                messages_list = []
                for msg in messages_queryset:
                    sender_avatar = ""
                    if msg.sender and hasattr(msg.sender, 'avatar') and msg.sender.avatar:
                        sender_avatar = msg.sender.avatar.url
                    
                    sender_display_name = "Система"
                    if msg.sender:
                        sender_display_name = msg.sender.username if msg.sender.username else msg.sender.email
                        
                    messages_list.append({
                        'sender_email': msg.sender.email if msg.sender else "",
                        'sender_name': sender_display_name,
                        'avatar': sender_avatar,
                        'text': msg.text,
                        'time': msg.created_at.strftime('%H:%M')
                    })
                
                return JsonResponse({
                    "success": True,
                    "chat_id": chat_id,
                    "history": messages_list
                })

        return response