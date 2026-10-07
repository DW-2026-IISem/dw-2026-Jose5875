import {
  Cancelacion,
  CancelacionI,
} from "../cancelacion.model";

export type CancelacionResponseDto = CancelacionI;

export function toCancelacionResponse(
  cancelacion: Cancelacion
): CancelacionResponseDto {
  return cancelacion.toJSON() as CancelacionResponseDto;
}
