import { Request, Response } from "express";
import {
  CreateCancelacionDto,
  PatchCancelacionDto,
  UpdateCancelacionDto,
} from "./dto";
import { CancelacionesService } from "./cancelaciones.service";

export class CancelacionesController {
  private readonly service =
    new CancelacionesService();

  getAll = async (_req: Request, res: Response) => {
    const cancelaciones =
      await this.service.getAll();

    res.status(200).json(cancelaciones);
  };

  getOne = async (
    req: Request,
    res: Response
  ) => {
    const id = Number(req.params.id);

    const cancelacion =
      await this.service.getOne(id);

    res.status(200).json(cancelacion);
  };

  create = async (
    req: Request,
    res: Response
  ) => {
    const data =
      req.body as CreateCancelacionDto;

    const cancelacion =
      await this.service.create(data);

    res.status(201).json(cancelacion);
  };

  updatePut = async (
    req: Request,
    res: Response
  ) => {
    const id = Number(req.params.id);

    const data =
      req.body as UpdateCancelacionDto;

    const cancelacion =
      await this.service.updatePut(id, data);

    res.status(200).json(cancelacion);
  };

  updatePatch = async (
    req: Request,
    res: Response
  ) => {
    const id = Number(req.params.id);

    const data =
      req.body as PatchCancelacionDto;

    const cancelacion =
      await this.service.updatePatch(id, data);

    res.status(200).json(cancelacion);
  };

  delete = async (
    req: Request,
    res: Response
  ) => {
    const id = Number(req.params.id);

    await this.service.deletePhysical(id);

    res.status(204).send();
  };
}
