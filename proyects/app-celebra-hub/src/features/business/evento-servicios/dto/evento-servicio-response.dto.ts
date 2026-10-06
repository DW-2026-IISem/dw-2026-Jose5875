import { EventoServicio, EventoServicioI } from "../evento-servicio.model";

export type EventoServicioResponseDto = EventoServicioI;

export const toEventoServicioResponse = (
  eventoServicio: EventoServicio
): EventoServicioResponseDto => {
  return eventoServicio.toJSON() as EventoServicioResponseDto;
};
