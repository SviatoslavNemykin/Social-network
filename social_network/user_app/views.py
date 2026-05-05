from django.shortcuts import render, redirect
from django.urls import reverse
from django.views.generic import TemplateView, View
from django.http import JsonResponse
from .forms import RegForm, AuthForm, ConfirmForm
from django.contrib.auth import login, logout
from django.core.mail import send_mail
from django.contrib.auth.decorators import login_required

@login_required
def render_user(request):
    if request.user.username == ' ' or request.user.username is None:
        return redirect('home')
    return render(request, "user_app/user.html")

class RegisterLoginView(TemplateView):
    template_name = "user_app/auth.html"
   
    def dispatch(self, request, *args, **kwargs):
        # Проверяем авторизацию здесь
        if request.user.is_authenticated:
            return redirect('home')
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['reg_form'] = RegForm()
        context['auth_form'] = AuthForm()
        context['confirm_form'] = ConfirmForm()
        if self.request.session.get('confirm_code'):
            context['show_confirm'] = True
            print("Показуємо форму підтвердження")
        return context
    
class RegisterView(View):
    def post(self, request, *args, **kwargs):
        form = RegForm(request.POST)
        if form.is_valid():
            code = form.generate_code()
            
            request.session['reg_data'] = form.get_session_data()
            request.session['confirm_code'] = code

            send_mail(
                'Код підтвердження',
                f'Ваш код: {code}',
                'your@email.com',
                [form.cleaned_data['email']],
            )
            
            return JsonResponse({
                "success": True,
                "redirect_url": reverse('auth')
            })

            # return redirect('auth')

        #     return JsonResponse({
        #         "success": True,
        #         "message": "Реєстрація успішна!"
        #     })
        return JsonResponse({
                "success": False,
                "message": "Помилка при реєстрації!",
                "errors": form.errors.get_json_data()
            },
            status=400
            )
    
class ConfirmView(View):
    def post(self, request, *args, **kwargs):
        form = ConfirmForm(request.POST)
        if form.is_valid():
            if form.check_code(request.session.get('confirm_code')):
                user = form.save(
                    request.session.get('reg_data')
                )

                request.session.flush()
                # return redirect('auth')
                return JsonResponse({
                "success": True,
                "redirect_url": reverse('auth')
                })
                

    
class LoginView(View):
    def post(self, request, *args, **kwargs):
        form = AuthForm(request= request,data= request.POST)

        if form.is_valid():
            user = form.get_user()
            login(request, user)

            # return JsonResponse({
            #     "success": True,
            #     "message": "Авторизація успішна!"
            # })
            # return redirect('home')
            return JsonResponse({
                "success": True,
                "redirect_url": reverse('home')
            })
        
        return JsonResponse({
                "success": False,
                "message": "Авторизація неуспішна!",
                "errors": form.errors.get_json_data()
            },
            status=400
            )
    
class LogoutView(View):
    def get(self, request, ):
        logout(request)
        return redirect("auth")
    