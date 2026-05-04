from django.urls import path
from .views import HomeView, UsernameSetupView

urlpatterns = [
    path('', HomeView.as_view(), name='home'),
    path('setup-username/', UsernameSetupView.as_view(), name='setup_username'),
]
