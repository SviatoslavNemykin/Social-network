from django.shortcuts import render
from django.views.generic import TemplateView
from .forms import RegForm, AuthForm, ConfirmForm

class AuthView(TemplateView):
    template_name = "user_app/auth.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['reg_form'] = RegForm()
        context['auth_form'] = AuthForm()
        context['confirm_form'] = ConfirmForm()
        return context

def render_user(request):
    return render(request, "user_app/user.html")