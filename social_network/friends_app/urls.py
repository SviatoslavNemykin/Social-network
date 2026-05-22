from django.urls import path
from .views import  friendsView, FriendsSectionView

urlpatterns = [
    path("", friendsView.as_view(), name="friends"),
    path('<str:section>/', FriendsSectionView.as_view(), name='friends_section'),
]