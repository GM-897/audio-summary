from django.db import models
from django.conf import settings

# Create your models here.

class AudioFile(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    filename = models.CharField(max_length=255, blank=True)
    file_url = models.URLField(max_length=1024, blank=True, null=True)
    s3_key = models.CharField(max_length=1024, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    transcription_text = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.filename}"

