from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import View, ListView, TemplateView
from user_app.models import Friendship
from my_publications.models import Post, Tag
from django.core.paginator import Page
from friends_app.services.friend_quries import *
from friends_app.services.friend_actions import *
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.template.loader import render_to_string
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
# Create your views here.



class FriendsView(LoginRequiredMixin, TemplateView):
    login_url = 'auth'
    template_name = 'friends_app/friends.html'
    
    def get(self, request, *args, **kwargs):
        if request.user.username == ' ' or request.user.username is None:
            return redirect('home')
        return super().get(request, *args, **kwargs)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        user = self.request.user

        context['sections'] = {
            "requests": {
                "title": "Запити",
                "users": get_friendship_requests(user)[:6]
            },
            "recommendations": {
                "title": "Рекомендації",
                "users": get_friendship_recommendations(user)[:6]
            },
            "friends": {
                "title": "Усі друзі",
                "users": get_friends(user)[:6]
            },
        }

        return context
    
class FriendsSectionView(LoginRequiredMixin, View):

    sections_map = {
        "requests": {
            "title": "Запити",
            "getter": get_friendship_requests,
        },

        "recommendations": {
            "title": "Рекомендації",
            "getter": get_friendship_recommendations,
        },

        "friends": {
            "title": "Всі друзі",
            "getter": get_friends,
        },
    }

    def get(self, request, section, *args, **kwargs):

        if section not in self.sections_map:
            return JsonResponse(
                {"error": "Invalid section"},
                status=404
            )

        users = self.sections_map[section]["getter"](
            request.user
        )

        page = request.GET.get("page", 1)

        page_obj = Paginator(users, 6).get_page(page)

        html = render_to_string(
            "friends_app/particles/friend_cards.html",
            {
                "users": page_obj.object_list,
                "section": section,
            },
            request=request,
        )

        return JsonResponse({
            "html": html,
            "has_next_page": page_obj.has_next(),
        })


class UserFriendView(LoginRequiredMixin, ListView):
    model = Post
    login_url = 'auth'
    template_name = 'friends_app/user.html'
    context_object_name = 'posts'
    paginate_by = 3

    def get(self, request, *args, **kwargs):
        if request.user.username == ' ' or request.user.username is None:
            return redirect('home')
        return super().get(request, *args, **kwargs)

    def render_to_response(self, context, **response_kwargs):
        if self.request.headers.get("x-requested-with") == "XMLHttpRequest":
            page_obj: Page = context["page_obj"]

            html = render_to_string(
                "my_publications/particles/post_items.html",
                {"posts": context["posts"]},
                request=self.request
            )
            return JsonResponse({
                "html":html,
                "has_next": page_obj.has_next()
            })
        return super().render_to_response(context, **response_kwargs)

    def get_queryset(self):
        return (
            Post.objects.filter(author_id = self.kwargs['user_id']).
            select_related('author').
            prefetch_related('tags', 'links', 'images').
            order_by('-id')
            )
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = get_user_model()
        context['user'] = get_object_or_404(
            user,
            id=self.kwargs['user_id']
        )
        context["relationship"] = get_friendship(self.request.user, context['user'])
        return context
    

class FriendActionView(LoginRequiredMixin, View):
    login_url = 'auth'

    def post(self, request, user_id, action, *args, **kwargs):
        other_user = User.objects.get(id=user_id)
        current_user = request.user

        if action == "add":
            return JsonResponse(add_friend_request(current_user, other_user))
        
        elif action == "dismiss":
            return JsonResponse(dismiss_recommendation(current_user, other_user))
        
        elif action == "accept":
            return JsonResponse(accept_friend_request(current_user, other_user))
        
        elif action == "delete":
            return JsonResponse(delete_friendship(current_user, other_user))