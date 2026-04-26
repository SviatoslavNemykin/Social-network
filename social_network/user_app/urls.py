from django.urls import path
from .views import render_user, AuthView

urlpatterns = [
    path("", render_user, name="user"),
    path('auth/', AuthView.as_view(), name='auth')
]