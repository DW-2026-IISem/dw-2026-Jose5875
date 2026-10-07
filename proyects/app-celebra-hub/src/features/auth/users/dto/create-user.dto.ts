/**
 * Datos de entrada de `POST /api/usuarios`.
 */
export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  avatar?: string | null;
  status?: "active" | "inactive";
}
