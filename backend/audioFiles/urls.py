# audioFiles/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import PresignUploadView, NotifyUploadView, TranscriptionStatusView

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('audio/upload/', PresignUploadView.as_view(), name='audio-upload'),
    path('audio/notify/', NotifyUploadView.as_view(), name='audio-notify'),
    path('audio/<int:pk>/status/', TranscriptionStatusView.as_view(), name='audio-status'),
]