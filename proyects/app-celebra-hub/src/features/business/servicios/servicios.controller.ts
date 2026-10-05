import { Request, Response } from "express";

import { BaseController } from "../../../shared/http/base-controller";

import {
  CreateServicioDto,
  PatchServicioDto,
  UpdateServicioDto
} from "./dto";

import { ServiciosService } from "./servicios.service";

export class ServiciosController
  extends BaseController {

  public constructor(
    private readonly service: ServiciosService =
      new ServiciosService()
  ) {
    super();
  }

  // ================== READ ==================

  public async getAll(
    _req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const servicios =
          await this.service.getAll();

        res.status(200).json({
          servicios
        });
      }
    );
  }

  public async getOne(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const servicio =
          await this.service.getOne(
            this.paramId(req)
          );

        res.status(200).json({
          servicio
        });
      }
    );
  }

  // ================== CREATE ==================

  public async create(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const servicio =
          await this.service.create(
            req.body as CreateServicioDto
          );

        res.status(201).json({
          servicio
        });
      }
    );
  }

  // ================== UPDATE ==================

  public async updatePut(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const servicio =
          await this.service.updatePut(
            this.paramId(req),
            req.body as UpdateServicioDto
          );

        res.status(200).json({
          servicio
        });
      }
    );
  }

  public async updatePatch(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const servicio =
          await this.service.updatePatch(
            this.paramId(req),
            req.body as PatchServicioDto
          );

        res.status(200).json({
          servicio
        });
      }
    );
  }

  // ================== DELETE ==================

  public async deletePhysical(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const id =
          this.paramId(req);

        await this.service.deletePhysical(id);

        res.status(200).json({
          message:
            "Servicio eliminado permanentemente",
          id
        });
      }
    );
  }

  public async deleteLogical(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const servicio =
          await this.service.deleteLogical(
            this.paramId(req)
          );

        res.status(200).json({
          message:
            "Servicio desactivado correctamente",
          servicio
        });
      }
    );
  }
}
