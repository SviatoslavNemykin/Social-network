from django.shortcuts import render

# Create your views here.

def render_friends(request):
    return render(request=request, template_name="friends_app/friends.html")