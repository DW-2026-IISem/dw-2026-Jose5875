import { Request, Response } from "express";
import { EventosService } from "./eventos.service";

export class EventosController {
  private readonly service = new EventosService();

  async getAll(_req: Request, res: Response): Promise<void> {
    const eventos = await this.service.getAll();
    res.status(200).json(eventos);
  }

  async getOne(req: Request, res: Response): Promise<void> {
    const evento = await this.service.getOne(Number(req.params.id));
    res.status(200).json(evento);
  }

  async create(req: Request, res: Response): Promise<void> {
    const evento = await this.service.create(req.body);
    res.status(201).json(evento);
  }

  async updatePut(req: Request, res: Response): Promise<void> {
    const evento = await this.service.updatePut(
      Number(req.params.id),
      req.body
    );

    res.status(200).json(evento);
  }

  async updatePatch(req: Request, res: Response): Promise<void> {
    const evento = await this.service.updatePatch(
      Number(req.params.id),
      req.body
    );

    res.status(200).json(evento);
  }

  async delete(req: Request, res: Response): Promise<void> {
    await this.service.deletePhysical(Number(req.params.id));
    res.status(204).send();
  }
}
