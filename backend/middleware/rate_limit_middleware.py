import time
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware que limita las solicitudes por IP
    Permite 60 solicitudes por minuto por cada IP única
    """

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.window_size = 60  # Ventana de tiempo en segundos
        # Diccionario para almacenar las solicitudes por IP
        # Estructura: {IP: [timestamp1, timestamp2, ...]}
        self.requests_cache = defaultdict(list)

    def _get_client_ip(self, request: Request) -> str:
        """Obtiene la IP del cliente, considerando proxies"""
        # X-Forwarded-For se usa cuando hay un proxy/nginx adelante
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _clean_old_requests(self, ip: str):
        """Elimina registros de solicitudes antiguas (más de 1 minuto)"""
        current_time = time.time()
        # Filtra solo los timestamps dentro del último minuto
        self.requests_cache[ip] = [
            timestamp for timestamp in self.requests_cache[ip]
            if current_time - timestamp < self.window_size
        ]

    async def dispatch(self, request: Request, call_next):
        client_ip = self._get_client_ip(request)

        # Limpia registros antiguos de esta IP
        self._clean_old_requests(client_ip)

        # Obtiene la lista actual de solicitudes
        requests = self.requests_cache[client_ip]

        # Verifica si excede el límite
        if len(requests) >= self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Demasiadas solicitudes. Intenta de nuevo en un minuto."
                }
            )

        # Agrega el timestamp actual
        requests.append(time.time())

        # Llama al siguiente middleware/endpoint
        response = await call_next(request)

        return response