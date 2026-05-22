from django.urls import path
from .views import render_friends, friendsView

urlpatterns = [
    path("", friendsView.as_view(), name="friends"),
]