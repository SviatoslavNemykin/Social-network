# from django import forms

# class RegForm(forms.Form):
#     email = forms.EmailField(required=True, label="Електронна пошта", attrs={'class': 'emai'})
#     password = forms.CharField(required=True, label="Пароль", attrs={'class': "password"})
#     confirm_password = forms.CharField(required=True, label="Підтвердіть пароль", attrs={'class': "password"})

# class AuthForm(forms.Form):
#     email = forms.EmailField(required=True, label="Електронна пошта", attrs={'class': "email"})
#     password = forms.CharField(required=True, label="Пароль", attrs={'class': "password"})

# class ConfirmForm(forms.Form):
#     confirm = forms.CharField(required=True, label="Код підтвердження", attrs={'class': "confirm"})

from django import forms

class RegForm(forms.Form):
    # Используем widget=forms.EmailInput для email
    email = forms.EmailField(
        required=True, 
        label="Електронна пошта", 
        widget=forms.EmailInput(attrs={'class': 'email'})
    )
    # Используем widget=forms.PasswordInput, чтобы скрыть символы пароля
    password = forms.CharField(
        required=True, 
        label="Пароль", 
        widget=forms.PasswordInput(attrs={'class': 'password'})
    )
    confirm_password = forms.CharField(
        required=True, 
        label="Підтвердіть пароль", 
        widget=forms.PasswordInput(attrs={'class': 'password'})
    )

class AuthForm(forms.Form):
    email = forms.EmailField(
        required=True, 
        label="Електронна пошта", 
        widget=forms.EmailInput(attrs={'class': 'email'})
    )
    password = forms.CharField(
        required=True, 
        label="Пароль", 
        widget=forms.PasswordInput(attrs={'class': 'password'})
    )

class ConfirmForm(forms.Form):
    confirm = forms.CharField(
        required=True, 
        label="Код підтвердження", 
        widget=forms.TextInput(attrs={'class': 'confirm'})
    )
