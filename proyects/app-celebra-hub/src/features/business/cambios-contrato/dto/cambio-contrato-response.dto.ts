import {
  CambioContrato,
  CambioContratoI,
} from "../cambio-contrato.model";

export type CambioContratoResponseDto = CambioContratoI;

export function toCambioContratoResponse(
  cambioContrato: CambioContrato
): CambioContratoResponseDto {
  return cambioContrato.toJSON() as CambioContratoResponseDto;
}
