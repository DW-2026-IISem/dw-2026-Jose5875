import {
  Request,
  Response
} from "express";

import {
  BaseController
} from "../../../shared/http/base-controller";

import {
  CreateEventoServicioDto,
  PatchEventoServicioDto,
  UpdateEventoServicioDto
} from "./dto";

import {
  EventoServiciosService
} from "./evento-servicios.service";

export class EventoServiciosController
  extends BaseController {

  public constructor(
    private readonly service:
      EventoServiciosService =
        new EventoServiciosService()
  ) {
    super();
  }

  public async getAll(
    _req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const eventoServicios =
          await this.service.getAll();

        res.status(200).json({
          eventoServicios
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

        const eventoServicio =
          await this.service.getOne(
            this.paramId(req)
          );

        res.status(200).json({
          eventoServicio
        });
      }
    );
  }

  public async create(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const eventoServicio =
          await this.service.create(
            req.body as CreateEventoServicioDto
          );

        res.status(201).json({
          eventoServicio
        });
      }
    );
  }

  public async updatePut(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const eventoServicio =
          await this.service.updatePut(
            this.paramId(req),
            req.body as UpdateEventoServicioDto
          );

        res.status(200).json({
          eventoServicio
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

        const eventoServicio =
          await this.service.updatePatch(
            this.paramId(req),
            req.body as PatchEventoServicioDto
          );

        res.status(200).json({
          eventoServicio
        });
      }
    );
  }

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
            "EventoServicio eliminado permanentemente",
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

        const eventoServicio =
          await this.service.deleteLogical(
            this.paramId(req)
          );

        res.status(200).json({
          message:
            "EventoServicio desactivado correctamente",
          eventoServicio
        });
      }
    );
  }
}
