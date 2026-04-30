from django.urls import path
from .views import render_user, RegisterLoginView, RegisterView, LoginView, ConfirmView, LogoutView 

urlpatterns = [
    path("", render_user, name="user"),
    path('auth/', RegisterLoginView.as_view(), name='auth'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('confirm/', ConfirmView.as_view(), name='confirm'),
    path("logout/", LogoutView.as_view(), name="logout"),
]