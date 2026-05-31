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
        return response