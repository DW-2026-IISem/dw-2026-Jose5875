export interface Proveedor {
  id: number;
  nit: string;
  razon_social: string;
  contacto: string;
  telefono: string;
  email: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProveedorPayload {
  nit: string;
  razon_social: string;
  contacto: string;
  telefono: string;
  email: string;
  is_active?: boolean;
}

export interface ProveedorUpdatePayload {
  nit: string;
  razon_social: string;
  contacto: string;
  telefono: string;
  email: string;
  is_active: boolean;
}
