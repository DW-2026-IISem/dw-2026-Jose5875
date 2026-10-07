/**
 * Datos de entrada de `POST /api/asignaciones-rol` — **asignar un rol a un usuario**.
 */
export interface CreateRoleUserDto {
  user_id: number;
  role_id: number;
}
