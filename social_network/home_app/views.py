from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from django.views.generic import View
from django.contrib.auth.mixins import LoginRequiredMixin
from .forms import UsernameSetupForm


class HomeView(LoginRequiredMixin, View):
    login_url = 'auth'
    def get(self, request):
        if request.user.username == ' ' or request.user.username is None:
            form = UsernameSetupForm()
            return render(request=request, template_name='home_app/home.html', context={'form': form})
        return render(request=request, template_name='home_app/home.html')
    

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

