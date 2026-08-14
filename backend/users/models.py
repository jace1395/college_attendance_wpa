from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models

class RoleChoices(models.TextChoices):
    ADMIN = 'Admin', 'Admin'
    PRINCIPAL = 'Principal', 'Principal'
    HOD = 'HOD', 'HOD'
    TEACHER = 'Teacher', 'Teacher'
    STUDENT = 'Student', 'Student'

class CustomUserManager(BaseUserManager):
    def create_user(self, email=None, roll_no=None, password=None, **extra_fields):
        if not email and not roll_no:
            raise ValueError('Either Email or Roll Number must be provided')
        email = self.normalize_email(email) if email else None
        user = self.model(email=email, roll_no=roll_no, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', RoleChoices.ADMIN)
        return self.create_user(email=email, password=password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, null=True, blank=True)
    roll_no = models.CharField(max_length=20, unique=True, null=True, blank=True)
    role = models.CharField(max_length=20, choices=RoleChoices.choices)
    is_first_login = models.BooleanField(default=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.roll_no if self.role == RoleChoices.STUDENT else str(self.email)