import random
from django import forms
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from .models import User
from django.contrib.auth.forms import AuthenticationForm


user = get_user_model()
class RegForm(forms.Form):
    email = forms.EmailField(
        required=True, 
        widget=forms.EmailInput(attrs={'placeholder': 'you@example.com'})
    )
    password = forms.CharField(
        required=True, 
        widget=forms.PasswordInput(attrs={'placeholder': 'Введи пароль'})
    )
    confirm_password = forms.CharField(
        required=True, 
        widget=forms.PasswordInput(attrs={'placeholder': 'Повтори пароль'})
    )

    class Meta:
        model = user
        # fields = ['email', 'password', 'confirm_password']

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if user.objects.filter(email=email).exists():
            raise forms.ValidationError("Користувач з таким email вже існує.")
        return email
    
    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")

        if password and confirm_password and password != confirm_password:
            self.add_error('confirm_password', "Паролі не співпадають.")
        return cleaned_data
    
    # def save(self, commit=True):
    #     user = super().save(commit=False)
    #     user.username = ''
    #     user.set_password(self.cleaned_data.get("password"))
    #     if commit:
    #         user.save()
    #     return user
    def generate_code(self):
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])

    # ✅ данные для сессии
    def get_session_data(self):
        return {
            "email": self.cleaned_data["email"],
            "password": self.cleaned_data["password"]
        }


class AuthForm(AuthenticationForm):
    username = forms.EmailField(
        required=True, 
        widget=forms.EmailInput(attrs={'placeholder': 'you@example.com'})
    )
    password = forms.CharField(
        required=True, 
        widget=forms.PasswordInput(attrs={'placeholder': 'Введи пароль'})
    )

    def clean(self):
        email = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')
        if email and password:
            self.user_cache = authenticate(
                self.request,
                username=email,
                password=password
            )
            if self.user_cache is None:
                raise forms.ValidationError("Невірний email або пароль.")
            
            self.confirm_login_allowed(self.user_cache)

        return self.cleaned_data



class ConfirmForm(forms.ModelForm):
    num1 = forms.CharField(required=True, max_length=1)
    num2 = forms.CharField(required=True, max_length=1)
    num3 = forms.CharField(required=True, max_length=1)
    num4 = forms.CharField(required=True, max_length=1)
    num5 = forms.CharField(required=True, max_length=1)
    num6 = forms.CharField(required=True, max_length=1)

    class Meta:
        model = user
        fields = []

    def get_code(self):
        return ''.join([
            self.cleaned_data['num1'],
            self.cleaned_data['num2'],
            self.cleaned_data['num3'],
            self.cleaned_data['num4'],
            self.cleaned_data['num5'],
            self.cleaned_data['num6'],
        ])

    # ✅ проверка кода
    def check_code(self, session_code):
        return self.get_code() == session_code

    # ✅ создание пользователя
    def save(self, session_data):
        User = get_user_model()
        return User.objects.create_user(
            username=" ",
            email=session_data['email'],
            password=session_data['password']
        )
    # def save(self, commit=True, session_data=None):
    #     # user = super().save(commit=False)
    #     user.email = session_data['email']
    #     user.username = ''
    #     user.set_password(session_data['password'])
    #     if commit:
    #         user.save()
    #     return user
    
