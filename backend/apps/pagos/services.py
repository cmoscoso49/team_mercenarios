import hashlib
import hmac as _hmac
import requests
from django.conf import settings


def _sign(params: dict) -> str:
    """HMAC-SHA256 signature for Flow API. Sort keys, concat key+value, sign."""
    cadena = ''.join(str(params[k]) for k in sorted(params.keys()))
    return _hmac.new(
        settings.FLOW_SECRET_KEY.encode('utf-8'),
        cadena.encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()


def crear_pago(orden_id: str, monto: int, descripcion: str, email: str = '') -> dict:
    """
    Creates a payment in Flow. Returns {'token': str, 'url': str}.
    Raises ValueError if FLOW_API_KEY is not configured.
    Raises requests.HTTPError on Flow API errors.
    """
    if not settings.FLOW_API_KEY:
        raise ValueError(
            'FLOW_API_KEY no configurada. Agregar al .env: '
            'FLOW_API_KEY=tu_clave_sandbox  FLOW_SECRET_KEY=tu_secreto_sandbox'
        )

    params = {
        'apiKey': settings.FLOW_API_KEY,
        'amount': str(int(monto)),
        'currency': 'CLP',
        'subject': descripcion[:250],
        'commerceOrder': orden_id,
        'urlReturn': settings.FLOW_RETURN_URL,
        'urlConfirmation': settings.FLOW_CONFIRM_URL,
    }
    if email:
        params['email'] = email
    params['s'] = _sign(params)

    resp = requests.post(
        f'{settings.FLOW_API_URL}/payment/create',
        data=params,
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()

    if 'token' not in data:
        raise ValueError(f'Flow respuesta inesperada: {data}')

    return {
        'token': data['token'],
        'url': f"{data['url']}?token={data['token']}",
    }


def verificar_pago(token: str) -> dict:
    """
    Gets payment status from Flow. Returns the full status dict.
    Flow status codes: 1=pendiente, 2=pagado, 3=rechazado, 4=anulado.
    """
    if not settings.FLOW_API_KEY:
        raise ValueError('FLOW_API_KEY no configurada.')

    params = {
        'apiKey': settings.FLOW_API_KEY,
        'token': token,
    }
    params['s'] = _sign(params)

    resp = requests.post(
        f'{settings.FLOW_API_URL}/payment/getStatus',
        data=params,
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def verificar_firma_webhook(post_data: dict) -> bool:
    """
    Verifies HMAC-SHA256 signature from Flow webhook.
    Returns True if valid (or if FLOW_SECRET_KEY not set — dev only).
    """
    if not settings.FLOW_SECRET_KEY:
        return True

    firma_recibida = post_data.get('s', '')
    params_sin_firma = {k: v for k, v in post_data.items() if k != 's'}
    firma_esperada = _sign(params_sin_firma)
    return _hmac.compare_digest(firma_recibida, firma_esperada)
