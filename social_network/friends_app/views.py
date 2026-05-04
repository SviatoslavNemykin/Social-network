from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required

# Create your views here.

@login_required
def render_friends(request):
    if request.user.username == ' ' or request.user.username is None:
        return redirect('home')
    return render(request=request, template_name="friends_app/friends.html")