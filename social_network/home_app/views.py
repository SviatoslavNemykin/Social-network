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
from django.shortcuts import redirect
from friends_app.services.friend_quries import get_friendship_requests

# class HomeView(LoginRequiredMixin, View):
#     login_url = 'auth'
#     def get(self, request):
#         if request.user.username == ' ' or request.user.username is None:
#             form = UsernameSetupForm()
#             return render(request=request, template_name='home_app/home.html', context={'form_user_setup': form})
#         form = PostForm()
#         return render(request=request, template_name='home_app/home.html', context={'form': form, 'tag_list': Tag.objects.all()})
    

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
                "html":html,
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

        context['form'] = PostForm()
        context['tag_list'] = Tag.objects.all()

        context['friend_requests'] = get_friendship_requests(self.request.user)[:3]
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

