from django.db import models
from django.contrib.auth import get_user_model


User = get_user_model()

class Tag(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    topic = models.CharField(max_length=255, blank=True, null=True)
    tags = models.ManyToManyField(Tag, related_name='tags')
    content = models.TextField()

    def __str__(self):
        return self.title


class Link(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='links')
    url = models.URLField(max_length=2000)

    def __str__(self):
        return self.url


class PostImage(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name= 'images')
    original = models.ImageField(upload_to="post_images/originals/")
    compressed = models.ImageField(upload_to="post_images/compressed/")

    def __str__(self):
        return self.original.name
