import {
  ClienteResponseDto,
  CreateClienteDto,
  PatchClienteDto,
  UpdateClienteDto,
  toClienteResponse
} from "./dto";

import {
  ClientesRepository
} from "./clientes.repository";

import {
  Cliente
} from "./cliente.model";

import {
  AppError
} from "../../../shared/errors/app-error";

export class ClientesService {

  public constructor(
    private readonly repository: ClientesRepository =
      new ClientesRepository()
  ) {}

  // ================== READ ==================

  public async getAll(): Promise<ClienteResponseDto[]> {
    const clientes =
      await this.repository.findAllActive();

    return clientes.map(
      (cliente) => toClienteResponse(cliente)
    );
  }

  public async getOne(
    id: number
  ): Promise<ClienteResponseDto> {
    return toClienteResponse(
      await this.findOrFail(id)
    );
  }

  // ================== CREATE ==================

  public async create(
    body: CreateClienteDto
  ): Promise<ClienteResponseDto> {

    const cliente =
      await this.repository.create({
        tipo_documento: body.tipo_documento,
        numero_documento: body.numero_documento,
        nombre: body.nombre,
        telefono: body.telefono,
        email: body.email,
        is_active: true
      });

    return toClienteResponse(cliente);
  }

  // ================== UPDATE ==================

  public async updatePut(
    id: number,
    body: UpdateClienteDto
  ): Promise<ClienteResponseDto> {

    const cliente =
      await this.findOrFail(id);

    await this.repository.update(
      cliente,
      {
        tipo_documento: body.tipo_documento,
        numero_documento: body.numero_documento,
        nombre: body.nombre,
        telefono: body.telefono,
        email: body.email
      }
    );

    return toClienteResponse(cliente);
  }

  public async updatePatch(
    id: number,
    body: PatchClienteDto
  ): Promise<ClienteResponseDto> {

    const cliente =
      await this.findOrFail(id);

    await this.repository.update(
      cliente,
      body
    );

    return toClienteResponse(cliente);
  }

  // ================== DELETE ==================

  public async deletePhysical(
    id: number
  ): Promise<void> {

    const cliente =
      await this.findOrFail(id, false);

    await this.repository.delete(cliente);
  }

  public async deleteLogical(
    id: number
  ): Promise<ClienteResponseDto> {

    const cliente =
      await this.findOrFail(id);

    await this.repository.update(
      cliente,
      {
        is_active: false
      }
    );

    return toClienteResponse(cliente);
  }

  // ================== HELPERS ==================

  private async findOrFail(
    id: number,
    onlyActive = true
  ): Promise<Cliente> {

    const cliente =
      await this.repository.findById(id);

    if (
      !cliente ||
      (onlyActive && !cliente.is_active)
    ) {
      throw new AppError(
        404,
        "Cliente no encontrado"
      );
    }

    return cliente;
  }
}
