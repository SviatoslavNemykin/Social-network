from django.urls import path
from .consumers import ChatConsumer, OnlineStatusConsumer, UnreadConsumer

websocket_urlpatterns = [
    path('chat/<int:chat_id>/', ChatConsumer.as_asgi()),
    path('chat/online/', OnlineStatusConsumer.as_asgi()),
    path('chat/unread/', UnreadConsumer.as_asgi())
]