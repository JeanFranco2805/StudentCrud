import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from datetime import datetime

# Configuración del logging de auditoría
audit_logger = logging.getLogger('audit')
audit_logger.setLevel(logging.INFO)

# Handler para el archivo audit.log
file_handler = logging.FileHandler('audit.log')
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(
    logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
)
audit_logger.addHandler(file_handler)


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Middleware de auditoría que registra operaciones CRUD sobre estudiantes
    Intercepta: POST, PUT, DELETE en /students
    Registra: operación, datos afectados, IP, timestamp
    """

    async def dispatch(self, request: Request, call_next):
        # Solo intercepta operaciones que afectan estudiantes
        if request.url.path.startswith("/students") and request.method in ["POST", "PUT", "DELETE"]:
            
            # Obtiene la IP del cliente
            client_ip = request.client.host if request.client else "unknown"
            
            # Lee el cuerpo de la solicitud (si existe)
            body = ""
            if request.method in ["POST", "PUT"]:
                # Consume el body para leerlo
                body_bytes = await request.body()
                body = body_bytes.decode('utf-8') if body_bytes else ""
                # Recrea el body para que esté disponible en call_next
                async def receive():
                    return {"type": "http.request", "body": body_bytes}
                request._receive = receive

            # Determina el tipo de operación
            operation = self._get_operation(request.method, request.url.path)

            # Llama al endpoint
            response = await call_next(request)

            # Registra la auditoría después de la operación
            audit_message = (
                f"Operation: {operation} | "
                f"Path: {request.url.path} | "
                f"IP: {client_ip} | "
                f"Status: {response.status_code} | "
                f"Datos: {body.replace('\n', '') if body else 'N/A'}"
            )
            audit_logger.info(audit_message)

            return response

        # Si no es operación de estudiantes, continua normalmente
        return await call_next(request)

    def _get_operation(self, method: str, path: str) -> str:
        """Determina el nombre de la operación"""
        if method == "POST":
            return "CREAR_ESTUDIANTE"
        elif method == "PUT":
            return "ACTUALIZAR_ESTUDIANTE"
        elif method == "DELETE":
            return "ELIMINAR_ESTUDIANTE"
        return "OTRO"