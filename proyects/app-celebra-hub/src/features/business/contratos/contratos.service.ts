import { AppError } from "../../../shared/errors/app-error";

import {
  CreateContratoDto,
  PatchContratoDto,
  UpdateContratoDto,
  toContratoResponse
} from "./dto";

import { ContratosRepository } from "./contratos.repository";

export class ContratosService {

  private repository =
    new ContratosRepository();

  async getAll() {

    const contratos =
      await this.repository.findAll();

    return contratos.map(
      toContratoResponse
    );
  }

  async getOne(id: number) {

    const contrato =
      await this.findOrFail(id);

    return toContratoResponse(
      contrato
    );
  }

  async create(
    body: CreateContratoDto
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

    if (body.valor < 0) {
      throw new AppError(
        400,
        "El valor del contrato no puede ser negativo"
      );
    }

    const existing =
      await this.repository.findByNumero(
        body.numero
      );

    if (existing) {
      throw new AppError(
        409,
        "Ya existe un contrato con ese número"
      );
    }

    const contrato =
      await this.repository.create({
        cliente_id:
          body.cliente_id,

        numero:
          body.numero,

        fecha_inicio:
          body.fecha_inicio,

        fecha_fin:
          body.fecha_fin,

        valor:
          body.valor,

        estado:
          body.estado
      });

    return toContratoResponse(
      contrato
    );
  }

  async updatePut(
    id: number,
    body: UpdateContratoDto
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

    if (body.valor < 0) {
      throw new AppError(
        400,
        "El valor del contrato no puede ser negativo"
      );
    }

    const contrato =
      await this.findOrFail(id);

    const existing =
      await this.repository.findByNumero(
        body.numero
      );

    if (
      existing &&
      existing.id !== contrato.id
    ) {
      throw new AppError(
        409,
        "Ya existe un contrato con ese número"
      );
    }

    const updated =
      await this.repository.update(
        contrato,
        {
          cliente_id:
            body.cliente_id,

          numero:
            body.numero,

          fecha_inicio:
            body.fecha_inicio,

          fecha_fin:
            body.fecha_fin,

          valor:
            body.valor,

          estado:
            body.estado
        }
      );

    return toContratoResponse(
      updated
    );
  }

  async updatePatch(
    id: number,
    body: PatchContratoDto
  ) {

    const contrato =
      await this.findOrFail(id);

    const fechaInicio =
      body.fecha_inicio ??
      contrato.fecha_inicio;

    const fechaFin =
      body.fecha_fin ??
      contrato.fecha_fin;

    if (
      new Date(fechaFin) <
      new Date(fechaInicio)
    ) {
      throw new AppError(
        400,
        "La fecha de finalización no puede ser anterior a la fecha de inicio"
      );
    }

    if (
      body.valor !== undefined &&
      body.valor < 0
    ) {
      throw new AppError(
        400,
        "El valor del contrato no puede ser negativo"
      );
    }

    if (body.numero) {

      const existing =
        await this.repository.findByNumero(
          body.numero
        );

      if (
        existing &&
        existing.id !== contrato.id
      ) {
        throw new AppError(
          409,
          "Ya existe un contrato con ese número"
        );
      }
    }

    const updated =
      await this.repository.update(
        contrato,
        body
      );

    return toContratoResponse(
      updated
    );
  }

  async deletePhysical(
    id: number
  ): Promise<void> {

    const contrato =
      await this.findOrFail(id);

    await this.repository.delete(
      contrato
    );
  }

  private async findOrFail(
    id: number
  ) {

    const contrato =
      await this.repository.findById(id);

    if (!contrato) {
      throw new AppError(
        404,
        "Contrato no encontrado"
      );
    }

    return contrato;
  }
}
