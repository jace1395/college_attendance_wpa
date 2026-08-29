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

        # THE PLACEHOLDER EMAIL FIX:
        # If IT hasn't provided an email, auto-generate one using the roll number!
        if not email and roll_no:
            email = f"{roll_no}@pending.vvm.edu.in"

        email = self.normalize_email(email)
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

    name = models.CharField(max_length=255, null=True, blank=True)

    email = models.EmailField(unique=True, null=True, blank=True)
    roll_no = models.CharField(max_length=20, unique=True, null=True, blank=True)
    role = models.CharField(max_length=20, choices=RoleChoices.choices)

    is_first_login = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)
    is_timetable_incharge = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        if self.name:
            return f"{self.name} ({self.roll_no if self.role == RoleChoices.STUDENT else self.role})"
        return self.roll_no if self.role == RoleChoices.STUDENT else str(self.email)