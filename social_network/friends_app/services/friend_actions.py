from user_app.models import Friendship
from django.db.models import Q


def get_friendship(current_user, other_user):
    friendship = Friendship.objects.filter(
        Q(from_user=current_user, to_user=other_user) |
        Q(from_user=other_user, to_user=current_user)
    ).first()

    return friendship.status if friendship else "not_friends"


def add_friend_request(current_user, other_user):
    Friendship.objects.get_or_create(
        from_user=current_user, 
        to_user=other_user, 
        defaults={"status":"pending"}
        )
    return {"label": "Очікування"}


def dismiss_recommendation(current_user, other_user):
    Friendship.objects.get_or_create(
        from_user=current_user, 
        to_user=other_user, 
        defaults={"status":"dismissed"}
        )
    return {"remove": True}


def accept_friend_request(current_user, other_user):
    friendship = Friendship.objects.filter(from_user=other_user, to_user=current_user).first()
    friendship.status = "accepted"
    friendship.save()
    return {"remove": True, "friend": other_user}


def delete_friendship(current_user, other_user):
    friendship = Friendship.objects.filter(from_user=current_user, to_user=other_user).first()
    if not friendship:
        friendship = Friendship.objects.filter(from_user=other_user, to_user=current_user).first()
    if friendship:
        friendship.delete()
    return {"remove": True}

