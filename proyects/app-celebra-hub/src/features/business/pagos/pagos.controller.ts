import { Request, Response } from "express";
import {
  CreatePagoDto,
  PatchPagoDto,
  UpdatePagoDto,
} from "./dto";
import { PagosService } from "./pagos.service";

export class PagosController {
  private readonly service = new PagosService();

  getAll = async (_req: Request, res: Response) => {
    const pagos = await this.service.getAll();

    res.status(200).json(pagos);
  };

  getOne = async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const pago = await this.service.getOne(id);

    res.status(200).json(pago);
  };

  create = async (req: Request, res: Response) => {
    const data = req.body as CreatePagoDto;

    const pago = await this.service.create(data);

    res.status(201).json(pago);
  };

  updatePut = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = req.body as UpdatePagoDto;

    const pago = await this.service.updatePut(id, data);

    res.status(200).json(pago);
  };

  updatePatch = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = req.body as PatchPagoDto;

    const pago = await this.service.updatePatch(id, data);

    res.status(200).json(pago);
  };

  delete = async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    await this.service.deletePhysical(id);

    res.status(204).send();
  };
}
