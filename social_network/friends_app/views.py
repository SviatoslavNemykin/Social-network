from django.shortcuts import render
from django.contrib.auth.decorators import login_required

# Create your views here.

@login_required
def render_friends(request):
    return render(request=request, template_name="friends_app/friends.html")