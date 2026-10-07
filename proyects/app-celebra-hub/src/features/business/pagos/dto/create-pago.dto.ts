export interface CreatePagoDto {
  referencia_tipo: string;
  referencia_id: number;
  metodo: string;
  monto: number;
  fecha: Date;
  estado: string;
}
