from rest_framework import serializers
from .models import AudioFile

class AudioFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AudioFile
        fields = ['id', 'filename', 'user', 'created_at'] 
        read_only_fields = ['user', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        # Attach the authenticated user to the `user` field on the model
        instance = AudioFile.objects.create(user=request.user, **validated_data)
        return instance