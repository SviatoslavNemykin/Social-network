from django.urls import path
from .views import  FriendsView, FriendsSectionView, UserFriendView

urlpatterns = [
    path("", FriendsView.as_view(), name="friends"),
    path('<str:section>/', FriendsSectionView.as_view(), name='friends_section'),
    path('user/<int:user_id>/', UserFriendView.as_view(), name='user_posts')
]