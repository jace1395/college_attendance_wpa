from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
import datetime


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

        # DYNAMIC DEFAULT PASSWORD:
        # If no password is supplied (e.g. bulk upload, admin panel), use Sdcce@{year}.
        # This ensures every account has a non-empty, policy-compliant initial password.
        if not password:
            password = f"Sdcce@{datetime.date.today().year}"

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
    is_hod = models.BooleanField(default=False)
    is_mentor = models.BooleanField(default=False)

    # This links a student to their specific mentor!
    mentor = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mentees',
        limit_choices_to={'is_mentor': True}
    )

    is_active = models.BooleanField(default=True)
    last_activity = models.DateTimeField(null=True, blank=True)
    
    department = models.ForeignKey('Department', on_delete=models.SET_NULL, null=True, blank=True)
    stream = models.ForeignKey('Stream', on_delete=models.SET_NULL, null=True, blank=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        if self.name:
            return f"{self.name} ({self.role})"
        return f"{self.email or self.roll_no} ({self.role})"


class Department(models.Model):
    objects = models.Manager()
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class Stream(models.Model):
    objects = models.Manager()
    name = models.CharField(max_length=255)
    department = models.ForeignKey('Department', on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.name

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    role = models.CharField(max_length=20, null=True, blank=True)
    action = models.CharField(max_length=100)
    target = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} by {self.user} - {self.timestamp}"

    class Meta:
        ordering = ['-timestamp']