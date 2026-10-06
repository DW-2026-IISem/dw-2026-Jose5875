import { Request, Response } from "express";

import {
  CreateReservaDto,
  PatchReservaDto,
  UpdateReservaDto
} from "./dto";

import { ReservasService } from "./reservas.service";

export class ReservasController {

  private service =
    new ReservasService();

  async getAll(
    _req: Request,
    res: Response
  ) {
    const reservas =
      await this.service.getAll();

    return res.status(200).json({
      reservas
    });
  }

  async getOne(
    req: Request,
    res: Response
  ) {
    const id =
      Number(req.params.id);

    const reserva =
      await this.service.getOne(id);

    return res.status(200).json({
      reserva
    });
  }

  async create(
    req: Request,
    res: Response
  ) {
    const body =
      req.body as CreateReservaDto;

    const reserva =
      await this.service.create(body);

    return res.status(201).json({
      reserva
    });
  }

  async updatePut(
    req: Request,
    res: Response
  ) {
    const id =
      Number(req.params.id);

    const body =
      req.body as UpdateReservaDto;

    const reserva =
      await this.service.updatePut(
        id,
        body
      );

    return res.status(200).json({
      reserva
    });
  }

  async updatePatch(
    req: Request,
    res: Response
  ) {
    const id =
      Number(req.params.id);

    const body =
      req.body as PatchReservaDto;

    const reserva =
      await this.service.updatePatch(
        id,
        body
      );

    return res.status(200).json({
      reserva
    });
  }

  async delete(
    req: Request,
    res: Response
  ) {
    const id =
      Number(req.params.id);

    await this.service.deletePhysical(
      id
    );

    return res.status(200).json({
      message: "Reserva eliminada correctamente"
    });
  }
}
