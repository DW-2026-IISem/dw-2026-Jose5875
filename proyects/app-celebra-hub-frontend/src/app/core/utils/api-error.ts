import { HttpErrorResponse } from '@angular/common/http';

export function toApiMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo conectar con CelebraHub. Verifica que la API esté activa en http://localhost:4000.';
    }
    if (error.status === 401) {
      return 'La sesión no es válida o expiró. Inicia sesión nuevamente.';
    }
    if (error.status === 403) {
      return 'No tienes permiso para realizar esta operación.';
    }

    const body: unknown = error.error;
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (body && typeof body === 'object' && 'error' in body) {
      if (typeof body.error === 'string') {
        return body.error;
      }
    }
    return error.message;
  }

  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}
