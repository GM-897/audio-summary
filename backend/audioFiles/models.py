from django.db import models
from django.conf import settings

# Create your models here.

class AudioFile(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    filename = models.CharField(max_length=255, blank=True)
    file_url = models.URLField(max_length=1024, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

