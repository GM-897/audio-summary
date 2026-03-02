from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import AudioUploadView , PresignUploadView

urlpatterns = [
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # path('audio/upload/', AudioUploadView.as_view(), name='audio-upload'),
    path('audio/upload/', PresignUploadView.as_view(), name='audio-upload'),
]