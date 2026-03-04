import os
import uuid
import boto3
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status

from .serializers import AudioFileSerializer
from .models import AudioFile


class AudioUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, format=None):
        serializer = AudioFileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            obj = serializer.save()
            return Response(AudioFileSerializer(obj).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PresignUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Return a presigned POST for direct S3 upload.

        Expects: { content_type: 'audio/mp4' }
        Returns: { url, fields, key }
        """
        content_type = request.data.get('content_type')
        if not content_type:
            return Response({'detail': 'content_type required'}, status=status.HTTP_400_BAD_REQUEST)

        # Allow caller to provide a desired filename; use its extension if present
        provided_name = request.data.get('filename')
        ext = ''
        if provided_name:
            ext = os.path.splitext(os.path.basename(provided_name))[1]

        unique_name = f"{uuid.uuid4()}"
        key = f'uploads/{request.user.id}/{unique_name}{ext}'

        client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME
        )

        presigned = client.generate_presigned_post(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME,
            Key=key,
            Fields={
                'acl': 'private',
                'Content-Type': content_type,
            },
            Conditions=[
                {'acl': 'private'},
                ['content-length-range', 1, 50 * 1024 * 1024],
                {'Content-Type': content_type},
            ],
            ExpiresIn=3600,
        )

        return Response({
            'url': presigned['url'],
            'fields': presigned['fields'],
            'key': key,
        })


class NotifyUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Notify backend that S3 upload completed and store metadata in DB.

        Expects: { key: 'audio/USERID/uuid' }
        """
        key = request.data.get('key')
        if not key:
            return Response({'detail': 'key required'}, status=status.HTTP_400_BAD_REQUEST)
        provided_name = request.data.get('filename')

        # Compute a public URL for the uploaded object. This assumes the
        # bucket is publicly addressable or that you want the standard S3 URL.
        bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
        region = getattr(settings, 'AWS_S3_REGION_NAME', None)
        if getattr(settings, 'AWS_S3_CUSTOM_DOMAIN', None):
            file_url = f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{key}"
        elif bucket and region and region != 'us-east-1':
            file_url = f"https://{bucket}.s3.{region}.amazonaws.com/{key}"
        elif bucket:
            file_url = f"https://{bucket}.s3.amazonaws.com/{key}"
        else:
            # Fallback: construct from presigned url format
            file_url = None

        audio = AudioFile.objects.create(
            user=request.user,
            filename=provided_name or os.path.basename(key),
            file_url=file_url,
        )
        # store key in FileField name so admin and other code see it
        # audio.filename.name = key
        audio.save()
        return Response(AudioFileSerializer(audio).data, status=status.HTTP_201_CREATED)