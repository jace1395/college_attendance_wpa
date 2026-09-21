import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

class Command(BaseCommand):
    help = 'Emergency reset of the primary Admin password to the default system password'

    def handle(self, *args, **kwargs):
        User = get_user_model()
        current_year = timezone.now().year
        default_password = f"Sdcce@{current_year}"

        # Try to find the primary admin
        admin_user = User.objects.filter(role='Admin').first()
        
        if not admin_user:
            admin_user = User.objects.filter(is_superuser=True).first()

        if not admin_user:
            self.stdout.write(self.style.ERROR('No Admin or Superuser found in the system!'))
            return

        admin_user.set_password(default_password)
        admin_user.save()

        self.stdout.write(self.style.SUCCESS(f'Successfully reset password for Admin: {admin_user.email or admin_user.name}'))
        self.stdout.write(self.style.WARNING(f'New Password is: {default_password}'))
        self.stdout.write(self.style.WARNING('Please login and change this password immediately.'))
