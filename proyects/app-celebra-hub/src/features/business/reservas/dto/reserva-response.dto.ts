import { ReservaI } from "../reserva.model";

export type ReservaResponseDto =
  ReservaI;

export function toReservaResponse(
  reserva: any
): ReservaResponseDto {
  return reserva.toJSON();
}
