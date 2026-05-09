from django import forms
from .models import *
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile


class MultipleFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True


class MultipleFileField(forms.FileField):

    def clean(self, data, initial=True):

        single_file_clean = super().clean

        if isinstance(data, (list, tuple)):
            return [single_file_clean(file, initial) for file in data]

        return single_file_clean(data, initial)


class PostForm(forms.ModelForm):

    images = MultipleFileField(
        label="Зображення",
        required=False,
        widget=MultipleFileInput(attrs={
            "multiple": True,
            "accept": "image/*"
        })
    )

    class Meta:
        model = Post

        fields = ['title', 'topic', 'content']

        labels = {
            'title': 'Назва публікації',
            'topic': 'Тема публікації',
            'content': 'Текст публікації',
        }

        widgets = {

            'title': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Напишіть назву публікації'
            }),

            'topic': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Напишіть тему публікації'
            }),

            'content': forms.Textarea(attrs={
                'class': 'form-text-area',
                'placeholder': 'Напишіть текст публікації',
                'rows': '',
                'cols': '',
            })
        }

    def __init__(self, *args, links=None, images=None, tags=None, **kwargs):

        super().__init__(*args, **kwargs)

        self.links_list = []
        self.tags_list = []
        self.images_list = []

        if links:
            for link in links:
                clean_link = link.strip()

                if clean_link:
                    self.links_list.append(clean_link)

        if tags:
            self.tags_list = tags

        if images:
            self.images_list = list(images)

    def clean(self):

        clean_data = super().clean()

        urls_field = forms.URLField(max_length=2000)

        for link in self.links_list:

            try:
                urls_field.clean(value=link)

            except forms.ValidationError:
                self.add_error(None, 'Некоректне посилання')

        image_field = forms.ImageField()

        for image in self.images_list:

            try:
                image_field.clean(image)

            except forms.ValidationError:
                self.add_error("images", "Завантажте коректне зображення")

        return clean_data

    def save(self, author, commit=True):

        post: Post = super().save(commit=False)

        post.author = author

        if commit:

            post.save()

            # TAGS
            tags_objects = []

            for tag_name in self.tags_list:

                tag, created = Tag.objects.get_or_create(
                    name=tag_name
                )

                tags_objects.append(tag)

            post.tags.set(tags_objects)

            # LINKS
            for url in self.links_list:

                Link.objects.create(
                    post=post,
                    url=url
                )

            # IMAGES
            for image in self.images_list:

                PostImage.objects.create(
                    post=post,
                    original=image,
                    compressed=self.compress_image(image)
                )

        return post

    def compress_image(self, image):

        original_name = image.name.rsplit('.', 1)[0]

        image.seek(0)

        pil_image = Image.open(image)

        pil_image = pil_image.convert("RGB")

        quality = 85

        width, height = pil_image.size

        MAX_COMPRESSED_IMAGE_SIZE = 5 * 1024 * 1024

        while True:

            buffer = BytesIO()

            pil_image.save(
                buffer,
                format="JPEG",
                quality=quality,
                optimize=True
            )

            if buffer.tell() <= MAX_COMPRESSED_IMAGE_SIZE:
                break

            if quality > 35:

                quality -= 10

            else:

                if width <= 50 or height <= 50:
                    break

                width = int(width * 0.9)
                height = int(height * 0.9)

                pil_image = pil_image.resize(
                    (width, height),
                    Image.Resampling.LANCZOS
                )

        image.seek(0)

        compressed_name = f"compressed_{original_name}.jpg"

        compressed_image = ContentFile(
            buffer.getvalue(),
            name=compressed_name
        )

        return compressed_image