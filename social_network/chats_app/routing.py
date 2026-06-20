from django.urls import path
from .consumers import ChatConsumer, OnlineStatusConsumer

websocket_urlpatterns = [
    path('chat/<int:chat_id>/', ChatConsumer.as_asgi()),
    path('chat/online/', OnlineStatusConsumer.as_asgi())
]