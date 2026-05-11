import json

from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import FormView, ListView
from django.urls import reverse_lazy, reverse
from django.http import JsonResponse

from .models import Post, Tag
from .forms import PostForm


class PostCreateView(LoginRequiredMixin, FormView):
    # template_name = 'my_publications/my_publications.html'
    template_name = 'my_publications/my_publications.html'
    form_class = PostForm
    login_url = reverse_lazy('auth')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['tag_list'] = Tag.objects.all()
        context['posts'] = Post.objects.all()
        return context

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


# class PostListView(ListView):

#     model = Post

#     template_name = 'post_app/post_list.html'

#     context_object_name = 'posts'

#     paginate_by = 2

#     def get_queryset(self):

#         return (
#             Post.objects
#             .select_related('author')
#             .prefetch_related('tags', 'links', 'images')
#             .order_by('-id')
#         )