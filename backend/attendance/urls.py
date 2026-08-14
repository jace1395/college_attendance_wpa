from django.urls import path
from . import views

urlpatterns = [
    path('my-attendance/', views.my_attendance_view, name='my-attendance'),
    path('report/download/', views.generate_attendance_report, name='download-report'),
]