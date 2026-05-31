import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message

class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.chat_id = self.scope["url_route"]['kwargs']['chat_id']
        self.room_group_name= f"chat_{self.chat_id}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        await self.send(
            text_data= json.dumps(
                {
                    'action': 'connection_confirmation',
                    'message': 'Підключення до чату було успішно встановлено'
                }
            )
        )
        print(f"Підключення до чату {self.room_group_name} було успішно встановлено")

    async def receive(self, text_data):
        dict_data = json.loads(text_data)
        message_text = dict_data.get('messageText', '').strip()
        if message_text:
            await self.save_message(message_text)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_chat_message',
                    'message_text': message_text,
                    'sender': self.scope['user'].email
                }
            )

    async def send_chat_message(self, event):
        await self.send(text_data=json.dumps({
            'action': 'chat_message',
            'message_text': event['message_text'],
            'sender': event['sender']
        }))

    @database_sync_to_async
    def save_message(self, text):
        user = self.scope['user']
        Message.objects.create(chat_id=self.chat_id, sender=user, text=text)