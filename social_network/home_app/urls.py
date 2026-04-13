from django.urls import path
from .views import render_home

urlpatterns = [
    path('', render_home, name='home')
]