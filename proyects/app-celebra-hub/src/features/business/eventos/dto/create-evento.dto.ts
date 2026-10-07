export interface CreateEventoDto {
  referencia_id: number;
  tipo: string;
  fecha: Date;
  cantidad: number;
  observaciones: string;
  estado: string;
}
