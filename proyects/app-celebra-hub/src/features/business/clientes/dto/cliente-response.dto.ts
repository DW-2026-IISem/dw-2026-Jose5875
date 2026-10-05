import {
  Cliente,
  ClienteI
} from "../cliente.model";

export type ClienteResponseDto = ClienteI;

export function toClienteResponse(
  cliente: Cliente
): ClienteResponseDto {
  return cliente.toJSON() as ClienteI;
}
