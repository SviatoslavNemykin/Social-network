from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.views.generic import View
from .forms import UsernameSetupForm

# Create your views here.
# @login_required
# def render_home(request):
#     return render(request=request, template_name='home_app/home.html')

class HomeView(View):
    def get(self, request):
        if not request.user.username:
            form = UsernameSetupForm()
            return render(request=request, template_name='home_app/home.html', context={'form': form})
        return render(request=request, template_name='home_app/home.html')
    
    def post(self, request):
        form = UsernameSetupForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            return redirect('home')
        return render(request=request, template_name='home_app/home.html', context={'form': form})
