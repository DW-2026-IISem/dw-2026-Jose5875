import { Servicio, ServicioI } from "../servicio.model";

export type ServicioResponseDto = ServicioI;

export function toServicioResponse(
  servicio: Servicio
): ServicioResponseDto {
  return servicio.toJSON() as ServicioResponseDto;
}
