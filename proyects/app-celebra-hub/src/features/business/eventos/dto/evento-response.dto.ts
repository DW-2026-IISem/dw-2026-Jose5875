import { EventoI } from "../evento.model";

export type EventoResponseDto = EventoI;

export function toEventoResponse(evento: EventoI): EventoResponseDto {
  return {
    id: evento.id,
    referencia_id: evento.referencia_id,
    tipo: evento.tipo,
    fecha: evento.fecha,
    cantidad: evento.cantidad,
    observaciones: evento.observaciones,
    estado: evento.estado,
  };
}
