import { Request, Response } from "express";
import { SalonesService } from "./salones.service";

export class SalonesController {

  private service: SalonesService =
    new SalonesService();

  public async getAll(
    _req: Request,
    res: Response
  ) {
    const salones =
      await this.service.getAll();

    return res.status(200).json({
      salones
    });
  }

  public async getOne(
    req: Request,
    res: Response
  ) {
    const salon =
      await this.service.getOne(
        Number(req.params.id)
      );

    return res.status(200).json({
      salon
    });
  }

  public async create(
    req: Request,
    res: Response
  ) {
    const salon =
      await this.service.create(req.body);

    return res.status(201).json({
      salon
    });
  }

  public async updatePut(
    req: Request,
    res: Response
  ) {
    const salon =
      await this.service.updatePut(
        Number(req.params.id),
        req.body
      );

    return res.status(200).json({
      salon
    });
  }

  public async updatePatch(
    req: Request,
    res: Response
  ) {
    const salon =
      await this.service.updatePatch(
        Number(req.params.id),
        req.body
      );

    return res.status(200).json({
      salon
    });
  }

  public async delete(
    req: Request,
    res: Response
  ) {
    await this.service.deletePhysical(
      Number(req.params.id)
    );

    return res.status(200).json({
      message:
        "Salón eliminado correctamente"
    });
  }

  public async deactivate(
    req: Request,
    res: Response
  ) {
    const salon =
      await this.service.deactivate(
        Number(req.params.id)
      );

    return res.status(200).json({
      salon
    });
  }
}
