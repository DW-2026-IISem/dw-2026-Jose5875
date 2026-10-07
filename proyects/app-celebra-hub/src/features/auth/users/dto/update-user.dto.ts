/**
 * Datos de entrada de `PUT /api/usuarios/:id`.
 */
export interface UpdateUserDto {
  username: string;
  email: string;
  avatar?: string | null;
}
