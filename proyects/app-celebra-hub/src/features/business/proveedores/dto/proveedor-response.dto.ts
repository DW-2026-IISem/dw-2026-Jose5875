import { ProveedorI } from "../proveedor.model";

export type ProveedorResponseDto =
  ProveedorI;

export function toProveedorResponse(
  proveedor: any
): ProveedorResponseDto {
  return proveedor.toJSON();
}
