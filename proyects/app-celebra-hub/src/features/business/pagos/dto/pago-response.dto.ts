import { Pago, PagoI } from "../pago.model";

export type PagoResponseDto = PagoI;

export function toPagoResponse(pago: Pago): PagoResponseDto {
  return pago.toJSON() as PagoResponseDto;
}
