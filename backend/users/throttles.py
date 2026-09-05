from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """
    Aggressively throttles the login endpoint only.
    5 attempts per minute per IP — prevents brute-force password attacks.
    Configure the rate in settings.py under DEFAULT_THROTTLE_RATES['login'].
    """
    scope = 'login'
