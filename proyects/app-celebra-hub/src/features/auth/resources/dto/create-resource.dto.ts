/**
 * Datos de entrada de `POST /api/recursos`.
 */
export interface CreateResourceDto {
  method: string;
  path: string;
  description?: string | null;
  status?: "active" | "inactive";
}
