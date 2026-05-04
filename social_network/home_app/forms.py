from django import forms

from django.contrib.auth import get_user_model


user = get_user_model()
class UsernameSetupForm(forms.ModelForm):
    class Meta:
        model = user
        fields = ['username', 'first_name']

    def clean_username(self):
        username = self.cleaned_data['username']

        if user.objects.filter(username=username).exists():
            raise forms.ValidationError("Этот юзернейм уже занят")

        return username