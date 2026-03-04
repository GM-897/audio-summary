from rest_framework import serializers
from .models import AudioFile

class AudioFileSerializer(serializers.ModelSerializer):
    file_url = serializers.CharField(read_only=True)

    class Meta:
        model = AudioFile
        fields = ['id', 'filename', 'file_url', 'user', 'created_at']
        read_only_fields = ['user', 'created_at', 'file_url']

    def create(self, validated_data):
        request = self.context.get('request')
        # Attach the authenticated user to the `user` field on the model
        instance = AudioFile.objects.create(user=request.user, **validated_data)
        return instance