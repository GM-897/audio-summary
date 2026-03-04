import os
import boto3
import tempfile
from celery import shared_task
from groq import Groq
from django.conf import settings
from .models import AudioFile

@shared_task
def process_audio_transcription(audio_file_id):
    try:
        audio = AudioFile.objects.get(id=audio_file_id)
        audio.status = 'processing'
        audio.save()

        # Initialize Clients
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME
        )
        groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

        s3_key = audio.s3_key or audio.file_url
        if not s3_key:
            raise RuntimeError('No s3_key or file_url present on AudioFile')

        # If file_url was provided, extract key (object name) when necessary
        # If s3_key already contains the key, use it directly.
        if s3_key.startswith('http'):
            # Try to derive key from URL by removing bucket domain
            from urllib.parse import urlparse
            parsed = urlparse(s3_key)
            # path starts with '/{key}'
            s3_key = parsed.path.lstrip('/')

        # Download temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
            s3_client.download_file(
                settings.AWS_STORAGE_BUCKET_NAME, 
                s3_key,
                temp_file.name
            )
            temp_path = temp_file.name

        # Call Groq Whisper API
        with open(temp_path, "rb") as file_data:
            transcription = groq_client.audio.transcriptions.create(
              file=(temp_path, file_data.read()),
              model="whisper-large-v3",
              response_format="json"
            )
        
        # Save Results
        audio.transcription_text = transcription.text
        audio.status = 'completed'
        audio.save()

        # Cleanup
        os.remove(temp_path)
        return "Transcription Complete"

    except Exception as e:
        audio.status = 'failed'
        audio.save()
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)
        return str(e)