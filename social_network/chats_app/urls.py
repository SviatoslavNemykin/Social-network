from django.urls import path
from .views import ChatsView, ChatWithView

urlpatterns = [
    path("", ChatsView.as_view(), name="chats"),
    path('chat_with/<int:user_id>/', ChatWithView.as_view(), name="chat_with"),
]