import json

from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import FormView, ListView
from django.urls import reverse_lazy, reverse
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.core.paginator import Page
from django.shortcuts import redirect

from .models import Post, Tag
from .forms import PostForm


class PostCreateView(LoginRequiredMixin, FormView):
    # template_name = 'my_publications/my_publications.html'
    # template_name = 'my_publications/my_publications.html'
    form_class = PostForm
    login_url = reverse_lazy('auth')
    login_url = 'auth'

    # def get_context_data(self, **kwargs):
    #     context = super().get_context_data(**kwargs)
    #     context['tag_list'] = Tag.objects.all()
    #     context['posts'] = Post.objects.all()
    #     return context

    def get_form_kwargs(self):

        kwargs = super().get_form_kwargs()

        if self.request.method == "POST":

            kwargs['links'] = self.request.POST.getlist('links')

            kwargs['images'] = self.request.FILES.getlist('images')

            raw_tags = self.request.POST.get('selected_tags', '[]')

            try:
                tags = json.loads(raw_tags) if raw_tags else []
            except json.JSONDecodeError:
                tags = []
    
            cleaned_tags = [tag.lstrip('#') for tag in tags]
            kwargs['tags'] = cleaned_tags

        return kwargs

    def form_valid(self, form):

        form.save(author=self.request.user)

        return JsonResponse({
                "success": True,
                "redirect_url": reverse('my_publications')
            })

    def form_invalid(self, form):

        return JsonResponse({
            'success': False,
            'message': 'Публікація не була створена',
            'errors': form.errors
        })



class PostListView(LoginRequiredMixin, ListView):
    model = Post
    login_url = 'auth'
    template_name = 'my_publications/my_publications.html'
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
            Post.objects.filter(author = self.request.user).
            select_related('author').
            prefetch_related('tags', 'links', 'images').
            order_by('-id')
            )
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        context['form'] = PostForm()
        context['tag_list'] = Tag.objects.all()

        return context