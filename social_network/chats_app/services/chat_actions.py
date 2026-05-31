from django.contrib.auth import get_user_model
from django.http import JsonResponse
from friends_app.services.friend_quries import get_friends
from chats_app.models import Chat

User = get_user_model()

def get_or_create_chat(request, user_id):
    current_user = request.user
    other_user = User.objects.get(id = user_id)
    friends = get_friends(current_user)

    if other_user not in friends:
        return JsonResponse({"success": False}, status=403)
    
    user_chat_ids = Chat.objects.filter(users=current_user, is_group=False).values_list("id", flat=True)
    chat = Chat.objects.filter(id__in = user_chat_ids, users=other_user, is_group=False).first()

    if chat is None:
        chat = Chat.objects.create(is_group=False)
        chat.users.add(current_user, other_user)

    return JsonResponse({"success": True, "chat_id": chat.id})