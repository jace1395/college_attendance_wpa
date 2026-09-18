from django.core.management.base import BaseCommand
from users.models import User, RoleChoices

class Command(BaseCommand):
    help = 'Seed core Admin and Principal users'

    def handle(self, *args, **options):
        import datetime
        current_year = datetime.date.today().year
        default_password = f"Sdcce@{current_year}"

        # 1. Clean up legacy @sdcce.edu accounts to ensure exactly 1 admin/principal
        User.objects.filter(email__in=['admin@sdcce.edu', 'principal@sdcce.edu']).delete()

        # 2. Create Admin
        admin_email = 'admin@vvm.edu.in'
        admin_user, admin_created = User.objects.get_or_create(
            email=admin_email,
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
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f"Admin user updated: {admin_email} | Password kept as is"))
        else:
            admin_user.set_password(default_password)
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f"Admin user created: {admin_email} | Password set to default"))

        # 3. Create Principal
        principal_email = 'principal@vvm.edu.in'
        principal_user, principal_created = User.objects.get_or_create(
            email=principal_email,
            defaults={
                'role': RoleChoices.PRINCIPAL,
            }
        )
        
        if not principal_created:
            principal_user.role = RoleChoices.PRINCIPAL
            principal_user.save()
            self.stdout.write(self.style.SUCCESS(f"Principal user updated: {principal_email} | Password kept as is"))
        else:
            principal_user.set_password(default_password)
            principal_user.save()
            self.stdout.write(self.style.SUCCESS(f"Principal user created: {principal_email} | Password set to default"))
        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully.'))
