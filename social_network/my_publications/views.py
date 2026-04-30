from django.shortcuts import render
from django.contrib.auth.decorators import login_required

# Create your views here.
@login_required
def render_my_publications(request):
    return render(request=request, template_name='my_publications/my_publications.html')