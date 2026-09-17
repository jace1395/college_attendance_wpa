from django.core.management.base import BaseCommand
from users.models import User, RoleChoices

class Command(BaseCommand):
    help = 'Seed core Admin and Principal users'

    def handle(self, *args, **options):
        # Create Admin
        admin_user, admin_created = User.objects.get_or_create(
            email='admin@sdcce.edu',
            defaults={
                'role': RoleChoices.ADMIN,
                'is_superuser': True,
                'is_staff': True,
            }
        )
        
        # In case the user already existed without proper flags
        if not admin_created:
            admin_user.role = RoleChoices.ADMIN
            admin_user.is_superuser = True
            admin_user.is_staff = True
            
        admin_user.set_password('Sdcce@2026')
        admin_user.save()
        
        self.stdout.write(self.style.SUCCESS(f"Admin user {'created' if admin_created else 'updated'}: admin@sdcce.edu"))

        # Create Principal
        principal_user, principal_created = User.objects.get_or_create(
            email='principal@sdcce.edu',
            defaults={
                'role': RoleChoices.PRINCIPAL,
            }
        )
        
        if not principal_created:
            principal_user.role = RoleChoices.PRINCIPAL
            
        principal_user.set_password('Sdcce@2026')
        principal_user.save()
        
        self.stdout.write(self.style.SUCCESS(f"Principal user {'created' if principal_created else 'updated'}: principal@sdcce.edu"))
        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully.'))
