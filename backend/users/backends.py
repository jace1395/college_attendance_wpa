from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class EmailOrRollNoBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        # Django passes 'email' in kwargs because USERNAME_FIELD = 'email'
        login_id = username or kwargs.get('email')
        
        if not login_id:
            return None
            
        try:
            # Search by email OR roll number
            user = User.objects.get(Q(email=login_id) | Q(roll_no=login_id))
            
            if user.check_password(password):
                return user
                
        except User.DoesNotExist:
            return None
        except User.MultipleObjectsReturned:
            # Safety fallback just in case of duplicate data
            user = User.objects.filter(Q(email=login_id) | Q(roll_no=login_id)).first()
            if user and user.check_password(password):
                return user
            return None