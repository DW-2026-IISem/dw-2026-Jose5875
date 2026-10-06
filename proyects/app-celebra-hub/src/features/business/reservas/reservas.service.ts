import { AppError } from "../../../shared/errors/app-error";

import {
  CreateReservaDto,
  PatchReservaDto,
  UpdateReservaDto,
  toReservaResponse
} from "./dto";

import { ReservasRepository } from "./reservas.repository";

export class ReservasService {

  private repository =
    new ReservasRepository();

  async getAll() {

    const reservas =
      await this.repository.findAll();

    return reservas.map(
      toReservaResponse
    );
  }

  async getOne(id: number) {

    const reserva =
      await this.findOrFail(id);

    return toReservaResponse(
      reserva
    );
  }

  async create(
    body: CreateReservaDto
  ) {

    if (
      new Date(body.fecha_fin) <
      new Date(body.fecha_inicio)
    ) {
      throw new AppError(
        400,
        "La fecha de finalización no puede ser anterior a la fecha de inicio"
      );
    }

    const reserva =
      await this.repository.create({
        cliente_id: body.cliente_id,
        fecha_inicio:
          body.fecha_inicio,
        fecha_fin:
          body.fecha_fin,
        estado: body.estado,
        observaciones:
          body.observaciones ?? null
      });

    return toReservaResponse(
      reserva
    );
  }

  async updatePut(
    id: number,
    body: UpdateReservaDto
  ) {

    if (
      new Date(body.fecha_fin) <
      new Date(body.fecha_inicio)
    ) {
      throw new AppError(
        400,
        "La fecha de finalización no puede ser anterior a la fecha de inicio"
      );
    }

    const reserva =
      await this.findOrFail(id);

    const updated =
      await this.repository.update(
        reserva,
        {
          cliente_id:
            body.cliente_id,

          fecha_inicio:
            body.fecha_inicio,

          fecha_fin:
            body.fecha_fin,

          estado:
            body.estado,

          observaciones:
            body.observaciones ?? null
        }
      );

    return toReservaResponse(
      updated
    );
  }

  async updatePatch(
    id: number,
    body: PatchReservaDto
  ) {

    const reserva =
      await this.findOrFail(id);

    const fechaInicio =
      body.fecha_inicio ??
      reserva.fecha_inicio;

    const fechaFin =
      body.fecha_fin ??
      reserva.fecha_fin;

    if (
      new Date(fechaFin) <
      new Date(fechaInicio)
    ) {
      throw new AppError(
        400,
        "La fecha de finalización no puede ser anterior a la fecha de inicio"
      );
    }

    const updated =
      await this.repository.update(
        reserva,
        body
      );

    return toReservaResponse(
      updated
    );
  }

  async deletePhysical(
    id: number
  ): Promise<void> {

    const reserva =
      await this.findOrFail(id);

    await this.repository.delete(
      reserva
    );
  }

  private async findOrFail(
    id: number
  ) {

    const reserva =
      await this.repository.findById(id);

    if (!reserva) {
      throw new AppError(
        404,
        "Reserva no encontrada"
      );
    }

    return reserva;
  }
}
