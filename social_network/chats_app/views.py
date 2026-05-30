from django.shortcuts import redirect, render
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import View, ListView, TemplateView


# Create your views here.
class ChatsView(LoginRequiredMixin, TemplateView):
    login_url = 'auth'
    template_name = 'chats_app/chats.html'
    
    def get(self, request, *args, **kwargs):
        if request.user.username == ' ' or request.user.username is None:
            return redirect('home')
        return super().get(request, *args, **kwargs)
    
    
