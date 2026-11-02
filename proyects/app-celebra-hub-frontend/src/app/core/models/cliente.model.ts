export interface Cliente {
  id: number;
  tipo_documento: string;
  numero_documento: string;
  nombre: string;
  telefono: string;
  email: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientePayload {
  tipo_documento: string;
  numero_documento: string;
  nombre: string;
  telefono: string;
  email: string;
}
