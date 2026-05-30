from django.urls import path
from .views import  *

urlpatterns = [
    path("", ChatsView.as_view(), name="chats"),
    
]