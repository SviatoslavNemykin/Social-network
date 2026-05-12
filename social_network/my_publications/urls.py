from django.urls import path
from .views import PostCreateView, PostListView


urlpatterns = [
    path('', PostListView.as_view(), name='my_publications'),
    path('postcreate/', PostCreateView.as_view(), name='create_post')
]