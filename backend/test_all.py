import urllib.request
import urllib.error
import os

from django.core.wsgi import get_wsgi_application
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_wpa.settings')
application = get_wsgi_application()

from users.models import User
from rest_framework_simplejwt.tokens import RefreshToken

user = User.objects.get(email='admin@vvm.edu.in')
token = str(RefreshToken.for_user(user).access_token)

for fmt in ['excel', 'pdf', 'csv']:
    req = urllib.request.Request(f'http://localhost:8000/api/admin/backup/export/?type={fmt}&academic_year=All')
    req.add_header('Authorization', f'Bearer {token}')

    try:
        with urllib.request.urlopen(req) as response:
            print(f"[{fmt.upper()}] STATUS:", response.status)
            print(f"[{fmt.upper()}] CONTENT-TYPE:", response.headers.get('Content-Type'))
            print(f"[{fmt.upper()}] FILENAME:", response.headers.get('Content-Disposition'))
    except urllib.error.HTTPError as e:
        print(f"[{fmt.upper()}] HTTP ERROR:", e.code)
        print(f"[{fmt.upper()}] BODY:", e.read().decode('utf-8'))
    except Exception as e:
        print(f"[{fmt.upper()}] OTHER ERROR:", e)
