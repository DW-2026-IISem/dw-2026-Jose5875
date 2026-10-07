export interface UpdateContratoDto {
  cliente_id: number;
  numero: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  valor: number;
  estado: string;
}
