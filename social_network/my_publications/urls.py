from django.urls import path
from .views import render_my_publications

urlpatterns = [
    path('', render_my_publications, name='my_publications')
]