export interface CreateProveedorDto {
  nit: string;
  razon_social: string;
  contacto: string;
  telefono: string;
  email: string;
  is_active?: boolean;
}
