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

from django.utils import timezone
class UserLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        # Setting last_activity to 1 hour ago clears active session threshold immediately
        user.last_activity = timezone.now() - timezone.timedelta(hours=1)
        user.save(update_fields=['last_activity'])
        
        from users.services import log_audit
        log_audit(user, "User Logout", "Session ended via web interface")
        
        return Response({'success': 'Logged out successfully.'}, status=status.HTTP_200_OK)

class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        # We assume the user has admin role checked in the frontend or we can enforce it here
        if request.user.role not in ['Admin', 'Principal'] and not request.user.is_superuser:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        from users.models import User
        from users.services import log_audit
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        data = request.data
        if 'name' in data:
            user.name = data['name']
        if 'email' in data:
            user.email = data['email']
        if 'roll_no' in data:
            user.roll_no = data['roll_no']
        if 'role' in data:
            user.role = data['role']
        if 'department_id' in data:
            user.department_id = data['department_id']
        if 'stream_id' in data:
            user.stream_id = data['stream_id']
        if 'is_active' in data:
            user.is_active = data['is_active']
            
        user.save()
        log_audit(request.user, "User Updated", f"Updated details for user {user.email}")
        return Response({'message': 'User updated successfully'})

class MentorMenteesListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        mentor_id = request.query_params.get('mentor_id')
        if not mentor_id:
            return Response({'error': 'mentor_id is required'}, status=400)
            
        from users.models import User
        mentees = User.objects.select_related('stream').filter(mentor_id=mentor_id, role='Student', is_active=True).order_by('roll_no')
        data = [{
            'id': m.id,
            'name': m.name,
            'roll_no': m.roll_no,
            'stream': m.stream.name if m.stream else 'N/A'
        } for m in mentees]
        return Response({'mentees': data})

class UserSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['Admin', 'Principal'] and not request.user.is_superuser:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        query = request.query_params.get('q', '')
        if not query:
            return Response([])
            
        from django.db.models import Q
        from users.models import User
        users = User.objects.filter(
            Q(name__icontains=query) | 
            Q(email__icontains=query) | 
            Q(roll_no__icontains=query)
        )[:50]
        
        data = [{
            'id': u.id,
            'name': u.name,
            'email': u.email,
            'roll_no': u.roll_no,
            'role': u.role,
            'department': u.department.name if u.department else 'N/A'
        } for u in users]
        
        return Response(data)