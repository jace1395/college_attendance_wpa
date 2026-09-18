import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class StrongPasswordValidator:
    """
    Enforces: min 8 chars, 1 uppercase, 1 digit, 1 special character.
    Applied via AUTH_PASSWORD_VALIDATORS in settings.py.
    """

    def validate(self, password, user=None):
        errors = []

        if len(password) < 8:
            errors.append(
                ValidationError(
                    _("Password must be at least 8 characters long."),
                    code='password_too_short',
                )
            )

        if not re.search(r'[A-Z]', password):
            errors.append(
                ValidationError(
                    _("Password must contain at least one uppercase letter (A–Z)."),
                    code='password_no_upper',
                )
            )

        if not re.search(r'\d', password):
            errors.append(
                ValidationError(
                    _("Password must contain at least one digit (0–9)."),
                    code='password_no_digit',
                )
            )

        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?`~]', password):
            errors.append(
                ValidationError(
                    _("Password must contain at least one special character (e.g. @, #, $, !)."),
                    code='password_no_special',
                )
            )

        if errors:
            raise ValidationError(errors)

    def get_help_text(self):
        return _(
            "Your password must be at least 8 characters long and contain "
            "at least one uppercase letter, one digit, and one special character."
        )
