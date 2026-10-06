import {
  CreateEventoServicioDto,
  PatchEventoServicioDto,
  EventoServicioResponseDto,
  UpdateEventoServicioDto,
  toEventoServicioResponse
} from "./dto";

import {
  EventoServiciosRepository
} from "./evento-servicios.repository";

import {
  EventoServicio
} from "./evento-servicio.model";

import {
  AppError
} from "../../../shared/errors/app-error";

export class EventoServiciosService {

  public constructor(
    private readonly repository:
      EventoServiciosRepository =
        new EventoServiciosRepository()
  ) {}

  // ================== READ ==================

  public async getAll():
    Promise<EventoServicioResponseDto[]> {

    const registros =
      await this.repository.findAllActive();

    return registros.map(
      (registro) =>
        toEventoServicioResponse(registro)
    );
  }

  public async getOne(
    id: number
  ): Promise<EventoServicioResponseDto> {

    return toEventoServicioResponse(
      await this.findOrFail(id)
    );
  }

  // ================== CREATE ==================

  public async create(
    body: CreateEventoServicioDto
  ): Promise<EventoServicioResponseDto> {

    const eventoServicio =
      await this.repository.create({
        referencia_id:
          body.referencia_id,

        tipo:
          body.tipo,

        fecha:
          new Date(body.fecha),

        cantidad:
          body.cantidad,

        observaciones:
          body.observaciones ?? null,

        estado:
          body.estado ?? "pendiente"
      });

    return toEventoServicioResponse(
      eventoServicio
    );
  }

  // ================== UPDATE ==================

  public async updatePut(
    id: number,
    body: UpdateEventoServicioDto
  ): Promise<EventoServicioResponseDto> {

    const eventoServicio =
      await this.findOrFail(id);

    await this.repository.update(
      eventoServicio,
      {
        referencia_id:
          body.referencia_id,

        tipo:
          body.tipo,

        fecha:
          new Date(body.fecha),

        cantidad:
          body.cantidad,

        observaciones:
          body.observaciones ?? null,

        estado:
          body.estado ??
          eventoServicio.estado
      }
    );

    return toEventoServicioResponse(
      eventoServicio
    );
  }

  public async updatePatch(
    id: number,
    body: PatchEventoServicioDto
  ): Promise<EventoServicioResponseDto> {

    const eventoServicio =
      await this.findOrFail(id);

    const data:
      Partial<EventoServicio> = {};

    if (
      body.referencia_id !== undefined
    ) {
      data.referencia_id =
        body.referencia_id;
    }

    if (
      body.tipo !== undefined
    ) {
      data.tipo =
        body.tipo;
    }

    if (
      body.fecha !== undefined
    ) {
      data.fecha =
        new Date(body.fecha);
    }

    if (
      body.cantidad !== undefined
    ) {
      data.cantidad =
        body.cantidad;
    }

    if (
      body.observaciones !== undefined
    ) {
      data.observaciones =
        body.observaciones;
    }

    if (
      body.estado !== undefined
    ) {
      data.estado =
        body.estado;
    }

    await this.repository.update(
      eventoServicio,
      data
    );

    return toEventoServicioResponse(
      eventoServicio
    );
  }

  // ================== DELETE ==================

  public async deletePhysical(
    id: number
  ): Promise<void> {

    const eventoServicio =
      await this.findOrFail(
        id,
        false
      );

    await this.repository.delete(
      eventoServicio
    );
  }

  public async deleteLogical(
    id: number
  ): Promise<EventoServicioResponseDto> {

    const eventoServicio =
      await this.findOrFail(id);

    await this.repository.update(
      eventoServicio,
      {
        estado: "inactivo"
      }
    );

    return toEventoServicioResponse(
      eventoServicio
    );
  }

  // ================== HELPER ==================

  private async findOrFail(
    id: number,
    onlyActive = true
  ): Promise<EventoServicio> {

    const eventoServicio =
      await this.repository.findById(id);

    if (!eventoServicio) {

      throw new AppError(
        404,
        "EventoServicio no encontrado"
      );
    }

    if (
      onlyActive &&
      eventoServicio.estado === "inactivo"
    ) {

      throw new AppError(
        404,
        "EventoServicio no encontrado"
      );
    }

    return eventoServicio;
  }
}
