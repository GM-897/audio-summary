import boto3
from django.shortcuts import render
from rest_framework.views import APIView, settings, settings
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status

from .serializers import AudioFileSerializer
import uuid
import boto3
from django.conf import settings

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
        # filename = request.data.get('filename')
        content_type = request.data.get('content_type')

        # if not filename:
        #     return Response({'detail': 'filename required'}, status=400)

        unique_name = f"{uuid.uuid4()}"
        key = f'audio/{request.user.id}/{unique_name}'

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
                "acl": "private",
                "Content-Type": content_type
            },
            Conditions=[
                {"acl": "private"},
                ["content-length-range", 1, 50 * 1024 * 1024],
                {"Content-Type": content_type}
            ],
            ExpiresIn=3600
        )
        print(presigned)

        return Response({
            'url': presigned['url'],
            'fields': presigned['fields'],
            'key': key
        })