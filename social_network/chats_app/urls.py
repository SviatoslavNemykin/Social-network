from django.urls import path
from .views import ChatsView, ChatWithView, CreateGroupView, ChatHistoryView, MessageUploadView

urlpatterns = [
    path('', ChatsView.as_view(), name='chats'),
    path('chat_with/<int:user_id>/', ChatWithView.as_view(), name='chat_with'),
    path('create_group/', CreateGroupView.as_view(), name='create_group'),
    path('history/<int:chat_id>/', ChatHistoryView.as_view(), name='chat_history'),
    path('upload_images/<int:chat_id>/', MessageUploadView.as_view(), name='upload_images'),
]