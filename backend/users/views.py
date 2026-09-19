from django.shortcuts import render

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import AllowAny
from users.throttles import LoginRateThrottle

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        assert self.user is not None
        
        data['user'] = {  # type: ignore
            'id': self.user.id,
            'name': self.user.name,
            'email': self.user.email.lower(),
            'role': self.user.role,
            'is_hod': self.user.is_hod,
            'is_mentor': self.user.is_mentor,
            'is_timetable_incharge': self.user.is_timetable_incharge,
            'department': self.user.department.name if getattr(self.user, 'department', None) else None,
            'stream': self.user.stream.name if getattr(self.user, 'stream', None) else None,
            'is_first_login': self.user.is_first_login
        }
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    # Explicitly open to anonymous requests (login endpoint)
    permission_classes = [AllowAny]
    # 5 attempts per minute per IP — brute-force protection
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            from users.models import User
            from users.services import log_audit
            email = request.data.get('email')
            if email:
                user = User.objects.filter(email__iexact=email).first()
                if user:
                    log_audit(user, "User Login", f"Session started via web interface")
        return response

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'name': user.name,
            'email': user.email.lower(),
            'role': user.role,
            'is_first_login': user.is_first_login,
            'department': user.department.name if getattr(user, 'department', None) else None,
            'stream': user.stream.name if getattr(user, 'stream', None) else None,
        })

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not user.check_password(old_password):
            return Response({'error': 'Invalid old password.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response({'error': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.is_first_login = False
        user.save()
        
        from users.services import log_audit
        log_audit(user, "Password Updated", "User completed security password change")
        
        return Response({'success': 'Password updated successfully.'})