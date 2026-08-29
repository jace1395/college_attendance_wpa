from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from django.http import FileResponse
from .services import generate_attendance_report, process_timetable_upload
from users.services import process_user_upload


class ReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        download_format = request.query_params.get('download')  # 'csv' or 'excel'

        if not start_date or not end_date:
            return Response({"error": "Please provide start_date and end_date."}, status=400)

        try:
            result = generate_attendance_report(request.user, start_date, end_date, download_format)

            # If result is a FileResponse (CSV/Excel download)
            if isinstance(result, FileResponse):
                return result

            # Otherwise, return JSON for Recharts
            return Response(result)

        except PermissionError as e:
            return Response({"error": str(e)}, status=403)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class FileUploadAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if request.user.role not in ['Admin', 'Principal'] and not request.user.is_timetable_incharge:
            return Response({"error": "Unauthorized"}, status=403)

        upload_type = request.data.get('type')  # 'users' or 'timetable'
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response({"error": "No file provided"}, status=400)

        validator = FileExtensionValidator(allowed_extensions=['csv', 'xls', 'xlsx'])
        try:
            validator(file_obj)
        except ValidationError:
            return Response({"error": "Only .csv, .xls, and .xlsx files are allowed."}, status=400)

        try:
            if upload_type == 'users':
                count = process_user_upload(file_obj)
                return Response({"message": f"Successfully created {count} users."})
            elif upload_type == 'timetable':
                count = process_timetable_upload(file_obj)
                return Response({"message": f"Successfully scheduled {count} classes."})
            else:
                return Response({"error": "Invalid upload type."}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)