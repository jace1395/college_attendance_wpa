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
            # Search by email OR roll number (case-insensitive)
            user = User.objects.get(Q(email__iexact=login_id) | Q(roll_no__iexact=login_id))
            
            if user.check_password(password):
                return user
                
        except User.DoesNotExist:
            from django.db.models.functions import Replace
            from django.db.models import Value
            # Fallback for missing dots in username (e.g. "SumitKumar" instead of "sumit.kumar")
            stripped_login_id = login_id.replace('.', '')
            user = User.objects.annotate(
                stripped_email=Replace('email', Value('.'), Value(''))
            ).filter(stripped_email__iexact=stripped_login_id).first()
            
            if user and user.check_password(password):
                return user
                
            return None
        except User.MultipleObjectsReturned:
            # Safety fallback just in case of duplicate data
            user = User.objects.filter(Q(email__iexact=login_id) | Q(roll_no__iexact=login_id)).first()
            if user and user.check_password(password):
                return user
            return None