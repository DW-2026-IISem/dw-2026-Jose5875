import {
  CreateServicioDto,
  PatchServicioDto,
  ServicioResponseDto,
  UpdateServicioDto,
  toServicioResponse
} from "./dto";

import { ServiciosRepository } from "./servicios.repository";
import { Servicio } from "./servicio.model";

import { AppError } from "../../../shared/errors/app-error";

export class ServiciosService {

  public constructor(
    private readonly repository: ServiciosRepository =
      new ServiciosRepository()
  ) {}

  // ================== READ ==================

  public async getAll(): Promise<ServicioResponseDto[]> {

    const servicios =
      await this.repository.findAllActive();

    return servicios.map(
      (servicio) =>
        toServicioResponse(servicio)
    );
  }

  public async getOne(
    id: number
  ): Promise<ServicioResponseDto> {

    return toServicioResponse(
      await this.findOrFail(id)
    );
  }

  // ================== CREATE ==================

  public async create(
    body: CreateServicioDto
  ): Promise<ServicioResponseDto> {

    const servicio =
      await this.repository.create({
        nombre: body.nombre,
        descripcion:
          body.descripcion ?? null,
        is_active: true
      });

    return toServicioResponse(servicio);
  }

  // ================== UPDATE ==================

  public async updatePut(
    id: number,
    body: UpdateServicioDto
  ): Promise<ServicioResponseDto> {

    const servicio =
      await this.findOrFail(id);

    await this.repository.update(
      servicio,
      {
        nombre: body.nombre,
        descripcion:
          body.descripcion ?? null
      }
    );

    return toServicioResponse(servicio);
  }

  public async updatePatch(
    id: number,
    body: PatchServicioDto
  ): Promise<ServicioResponseDto> {

    const servicio =
      await this.findOrFail(id);

    await this.repository.update(
      servicio,
      body
    );

    return toServicioResponse(servicio);
  }

  // ================== DELETE ==================

  public async deletePhysical(
    id: number
  ): Promise<void> {

    const servicio =
      await this.findOrFail(id, false);

    await this.repository.delete(servicio);
  }

  public async deleteLogical(
    id: number
  ): Promise<ServicioResponseDto> {

    const servicio =
      await this.findOrFail(id);

    await this.repository.update(
      servicio,
      {
        is_active: false
      }
    );

    return toServicioResponse(servicio);
  }

  // ================== HELPERS ==================

  private async findOrFail(
    id: number,
    onlyActive = true
  ): Promise<Servicio> {

    const servicio =
      await this.repository.findById(id);

    if (
      !servicio ||
      (onlyActive && !servicio.is_active)
    ) {
      throw new AppError(
        404,
        "Servicio no encontrado"
      );
    }

    return servicio;
  }
}
