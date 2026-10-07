import { ContratoI } from "../contrato.model";

export type ContratoResponseDto =
  ContratoI;

export function toContratoResponse(
  contrato: any
): ContratoResponseDto {
  return contrato.toJSON();
}
