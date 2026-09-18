import datetime
from django.utils import timezone
from users.models import User

class UpdateLastActivityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Ensure user is authenticated
        if request.user.is_authenticated:
            # We don't want to update the DB on literally every request for performance reasons.
            # Let's only update it if it's been more than 1 minute since the last update.
            now = timezone.now()
            user = request.user
            
            # If last_activity is null or it's been > 1 min
            if not user.last_activity or (now - user.last_activity).total_seconds() > 60:
                User.objects.filter(pk=user.pk).update(last_activity=now)

        return response
