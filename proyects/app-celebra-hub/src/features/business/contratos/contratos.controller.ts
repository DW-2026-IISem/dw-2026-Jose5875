import { Request, Response } from "express";

import {
  CreateContratoDto,
  PatchContratoDto,
  UpdateContratoDto
} from "./dto";

import { ContratosService } from "./contratos.service";

export class ContratosController {

  private service =
    new ContratosService();

  async getAll(
    _req: Request,
    res: Response
  ) {
    const contratos =
      await this.service.getAll();

    return res.status(200).json({
      contratos
    });
  }

  async getOne(
    req: Request,
    res: Response
  ) {
    const id =
      Number(req.params.id);

    const contrato =
      await this.service.getOne(id);

    return res.status(200).json({
      contrato
    });
  }

  async create(
    req: Request,
    res: Response
  ) {
    const body =
      req.body as CreateContratoDto;

    const contrato =
      await this.service.create(body);

    return res.status(201).json({
      contrato
    });
  }

  async updatePut(
    req: Request,
    res: Response
  ) {
    const id =
      Number(req.params.id);

    const body =
      req.body as UpdateContratoDto;

    const contrato =
      await this.service.updatePut(
        id,
        body
      );

    return res.status(200).json({
      contrato
    });
  }

  async updatePatch(
    req: Request,
    res: Response
  ) {
    const id =
      Number(req.params.id);

    const body =
      req.body as PatchContratoDto;

    const contrato =
      await this.service.updatePatch(
        id,
        body
      );

    return res.status(200).json({
      contrato
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
      message:
        "Contrato eliminado correctamente"
    });
  }
}
