from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Department, Stream

admin.site.register(Department)
admin.site.register(Stream)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'roll_no', 'role', 'name', 'department', 'stream')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'roll_no', 'role')}),
        ('Academic Info', {'fields': ('department', 'stream', 'mentor')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_timetable_incharge', 'is_hod', 'is_mentor')}),
    )
