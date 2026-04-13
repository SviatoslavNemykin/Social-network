from django.urls import path
from .views import render_user

urlpatterns = [
    path("", render_user, name="user"),
]