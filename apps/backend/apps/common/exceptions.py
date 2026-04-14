from rest_framework.exceptions import APIException


class ConflictError(APIException):
    status_code = 409
    default_code = 'conflict'
    default_detail = 'The requested operation conflicts with the current resource state.'

