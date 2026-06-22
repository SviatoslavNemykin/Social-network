from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from django.views.generic import View, ListView
from django.contrib.auth.mixins import LoginRequiredMixin
from .forms import UsernameSetupForm
from my_publications.forms import PostForm
from my_publications.models import Tag, Post

from django.template.loader import render_to_string
from django.core.paginator import Page
from django.db.models import Max

# Импортируем функцию из friends_app и модель чатов
from friends_app.services.friends_actions import get_friends_request
from chats_app.models import Chat

class HomeView(LoginRequiredMixin, ListView):
    model = Post
    login_url = 'auth'
    template_name = 'home_app/home.html'
    context_object_name = 'posts'
    paginate_by = 3

    def get(self, request, *args, **kwargs):
        if request.user.username == ' ' or request.user.username is None:
            form = UsernameSetupForm()
            return render(request=request, template_name='home_app/home.html', context={'form_user_setup': form})
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
                "html": html,
                "has_next": page_obj.has_next()
            })
        return super().render_to_response(context, **response_kwargs)

    def get_queryset(self):
        return (
            Post.objects.all().
            select_related('author').
            prefetch_related('tags', 'links', 'images').
            order_by('-id')
        )
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        current_user = self.request.user

        context['form'] = PostForm()
        context['tag_list'] = Tag.objects.all()

        # Задача 2: Список входящих запросов в друзья
        context['friend_requests'] = get_friends_request(current_user)

        # Задача 3: Последние активные чаты текущего пользователя
        recent_chats = Chat.objects.filter(users=current_user).annotate(
            latest_message_time=Max('messages__created_at')
        ).order_by('-latest_message_time')[:3]

        # Для каждого чата определим "собеседника" или имя группы и последнее сообщение заранее
        processed_chats = []
        for chat in recent_chats:
            last_msg = chat.get_last_message()
            
            # Определяем имя и аватар для отображения на главной
            if chat.is_group:
                display_name = chat.name or f"Група #{chat.id}"
                display_avatar = chat.avatar.url if chat.avatar else None
            else:
                # Берем первого пользователя из чата, который не является текущим
                other_user = chat.users.exclude(id=current_user.id).first()
                if other_user:
                    display_name = other_user.first_name or other_user.username
                    display_avatar = None # Сюда можно добавить поле аватара пользователя, если оно есть
                else:
                    display_name = "Нотатки"
                    display_avatar = None

            processed_chats.append({
                'chat': chat,
                'display_name': display_name,
                'display_avatar': display_avatar,
                'last_message': last_msg,
                'other_user': other_user if not chat.is_group else None
            })

        context['recent_chats'] = processed_chats
        return context

class UsernameSetupView(LoginRequiredMixin, View):
    login_url = 'auth'
    def post(self, request, *args, **kwargs):
        form = UsernameSetupForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            
            return JsonResponse({
                "success": True,
                "redirect_url": reverse('home')
            })

        return JsonResponse({
                "success": False,
                "message": "Помилка при реєстрації!",
                "errors": form.errors.get_json_data()
            },
            status=400
        )