import {
  Request,
  Response
} from "express";

import {
  BaseController
} from "../../../shared/http/base-controller";

import {
  ClientesService
} from "./clientes.service";

import {
  CreateClienteDto,
  PatchClienteDto,
  UpdateClienteDto
} from "./dto";

export class ClientesController
  extends BaseController {

  public constructor(
    private readonly service: ClientesService =
      new ClientesService()
  ) {
    super();
  }

  // ================== READ ==================

  public async getAll(
    _req: Request,
    res: Response
  ): Promise<void> {

    await this.run(res, async () => {

      const clientes =
        await this.service.getAll();

      res.status(200).json({
        clientes
      });
    });
  }

  public async getOne(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(res, async () => {

      const cliente =
        await this.service.getOne(
          this.paramId(req)
        );

      res.status(200).json({
        cliente
      });
    });
  }

  // ================== CREATE ==================

  public async create(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(res, async () => {

      const cliente =
        await this.service.create(
          req.body as CreateClienteDto
        );

      res.status(201).json({
        cliente
      });
    });
  }

  // ================== UPDATE ==================

  public async updatePut(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(res, async () => {

      const cliente =
        await this.service.updatePut(
          this.paramId(req),
          req.body as UpdateClienteDto
        );

      res.status(200).json({
        cliente
      });
    });
  }

  public async updatePatch(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(res, async () => {

      const cliente =
        await this.service.updatePatch(
          this.paramId(req),
          req.body as PatchClienteDto
        );

      res.status(200).json({
        cliente
      });
    });
  }

  // ================== DELETE ==================

  public async deletePhysical(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(res, async () => {

      const id = this.paramId(req);

      await this.service.deletePhysical(id);

      res.status(200).json({
        message: "Cliente eliminado permanentemente",
        id
      });
    });
  }

  public async deleteLogical(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(res, async () => {

      const cliente =
        await this.service.deleteLogical(
          this.paramId(req)
        );

      res.status(200).json({
        message: "Cliente desactivado correctamente",
        cliente
      });
    });
  }
}
