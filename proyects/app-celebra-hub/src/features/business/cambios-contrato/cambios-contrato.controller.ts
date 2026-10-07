import { Request, Response } from "express";
import {
  CreateCambioContratoDto,
  PatchCambioContratoDto,
  UpdateCambioContratoDto,
} from "./dto";
import { CambiosContratoService } from "./cambios-contrato.service";

export class CambiosContratoController {
  private readonly service =
    new CambiosContratoService();

  getAll = async (_req: Request, res: Response) => {
    const cambios = await this.service.getAll();

    res.status(200).json(cambios);
  };

  getOne = async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const cambio = await this.service.getOne(id);

    res.status(200).json(cambio);
  };

  create = async (req: Request, res: Response) => {
    const data =
      req.body as CreateCambioContratoDto;

    const cambio = await this.service.create(data);

    res.status(201).json(cambio);
  };

  updatePut = async (
    req: Request,
    res: Response
  ) => {
    const id = Number(req.params.id);

    const data =
      req.body as UpdateCambioContratoDto;

    const cambio =
      await this.service.updatePut(id, data);

    res.status(200).json(cambio);
  };

  updatePatch = async (
    req: Request,
    res: Response
  ) => {
    const id = Number(req.params.id);

    const data =
      req.body as PatchCambioContratoDto;

    const cambio =
      await this.service.updatePatch(id, data);

    res.status(200).json(cambio);
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
