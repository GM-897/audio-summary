from django.db import models
from django.conf import settings

# Create your models here.

class AudioFile(models.Model):
    filename = models.FileField(upload_to='audio/')
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    url = models.URLField(blank=True, null=True)

