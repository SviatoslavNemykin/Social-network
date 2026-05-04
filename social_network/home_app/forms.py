from django import forms

from django.contrib.auth import get_user_model


user = get_user_model()
class UsernameSetupForm(forms.ModelForm):
    class Meta:
        model = user
        fields = ['username', 'first_name']
        widgets = {
            'username': forms.TextInput(attrs={
                'placeholder': '@'
            }),
            'first_name': forms.TextInput(attrs={
                'placeholder': 'Введіть Псевдонім автора'
            }),
        }   

    def clean_first_name(self):
        first_name = self.cleaned_data.get('first_name')

        if not first_name or not first_name.strip():
            raise forms.ValidationError("Вкажіть псевдонім")

        return first_name.strip()

    def clean_username(self):
        username = self.cleaned_data['username']

        if user.objects.filter(username=username).exists():
            raise forms.ValidationError("Этот юзернейм уже занят")

        return username