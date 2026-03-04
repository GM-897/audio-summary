from rest_framework import serializers
from .models import AudioFile

class AudioFileSerializer(serializers.ModelSerializer):
    file_url = serializers.CharField(read_only=True)
    s3_key = serializers.CharField(read_only=True)

    class Meta:
        model = AudioFile
        fields = ['id', 'filename', 'file_url', 's3_key', 'user', 'created_at', 'status', 'transcription_text']
        read_only_fields = ['user', 'created_at', 'file_url', 's3_key', 'transcription_text'] #meaning client can't set these, but they will be included in responses

    def create(self, validated_data):
        request = self.context.get('request')
        # Attach the authenticated user to the `user` field on the model
        instance = AudioFile.objects.create(user=request.user, **validated_data)
        return instance