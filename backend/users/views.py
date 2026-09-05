from django.shortcuts import render

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import AllowAny
from users.throttles import LoginRateThrottle

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        data['user'] = {
            'id': self.user.id,
            'name': self.user.name,
            'email': self.user.email,
            'role': self.user.role,
            'is_hod': self.user.is_hod,
            'is_mentor': self.user.is_mentor,
            'is_timetable_incharge': self.user.is_timetable_incharge,
            'department': getattr(self.user, 'department', 'General') # Fallback if department doesn't exist
        }
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    # Explicitly open to anonymous requests (login endpoint)
    permission_classes = [AllowAny]
    # 5 attempts per minute per IP — brute-force protection
    throttle_classes = [LoginRateThrottle]