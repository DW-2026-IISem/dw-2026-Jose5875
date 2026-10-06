export interface CreateReservaDto {
  cliente_id: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  estado: string;
  observaciones?: string | null;
}
