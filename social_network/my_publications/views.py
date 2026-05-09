from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from .forms import PostForm

# Create your views here.
@login_required
def render_my_publications(request):
    if request.user.username == ' ' or request.user.username is None:
        return redirect('home')
    form = PostForm()
    return render(request=request, template_name='my_publications/my_publications.html', context={'form': form})