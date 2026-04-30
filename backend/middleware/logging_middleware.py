import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from datetime import datetime

# Configuración del logging
logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware que registra cada solicitud HTTP en el archivo app.log
    Registra: método HTTP, path, código de estado, IP del cliente
    """

    async def dispatch(self, request: Request, call_next):
        # Obtiene la IP del cliente
        client_ip = request.client.host if request.client else "unknown"

        # Llama al siguiente middleware/endpoint
        response = await call_next(request)

        # Registra la información en el log
        log_message = (
            f"Method: {request.method} | "
            f"Path: {request.url.path} | "
            f"Status: {response.status_code} | "
            f"IP: {client_ip}"
        )
        logging.info(log_message)

        return response