from django.shortcuts import render

# Create your views here.
def render_user(request):
    return render(request, "user_app/user.html")