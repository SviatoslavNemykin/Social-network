from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import View, ListView, TemplateView
from user_app.models import Friendship
from friends_app.services.friend_quries import *
# Create your views here.

@login_required
def render_friends(request):
    if request.user.username == ' ' or request.user.username is None:
        return redirect('home')
    return render(request=request, template_name="friends_app/friends.html")

class friendsView(LoginRequiredMixin, TemplateView):
    login_url = 'auth'
    template_name = 'friends_app/friends.html'
    
    def get(self, request, *args, **kwargs):
        if request.user.username == ' ' or request.user.username is None:
            return redirect('home')
        return super().get(request, *args, **kwargs)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        context['sections'] = {
            "requests": {"title": "Запити", "users":get_friendship_requests(self.request.user)[:6]},
            "recomendations": {"title": "Рекомендації", "users":get_friendship_recommendations(self.request.user)[:6]},
            "friends": {"title": "Усі друзі", "users":get_friends(self.request.user)[:6]},
        }

        return context
    
