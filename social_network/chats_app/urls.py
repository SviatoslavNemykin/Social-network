from django.urls import path
from .views import ChatsView, ChatWithView, CreateGroupView, ChatHistoryView

urlpatterns = [
    path('', ChatsView.as_view(), name='chats'),
    path('chat_with/<int:user_id>/', ChatWithView.as_view(), name='chat_with'),
    path('create_group/', CreateGroupView.as_view(), name='create_group'),
    path('history/<int:chat_id>/', ChatHistoryView.as_view(), name='chat_history'),
]