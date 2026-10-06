import { Request, Response } from "express";

import {
  CreateProveedorDto,
  PatchProveedorDto,
  UpdateProveedorDto
} from "./dto";

import { ProveedoresService } from "./proveedores.service";

export class ProveedoresController {

  private service =
    new ProveedoresService();

  async getAll(
    _req: Request,
    res: Response
  ) {

    const proveedores =
      await this.service.getAll();

    return res.status(200).json({
      proveedores
    });
  }

  async getOne(
    req: Request,
    res: Response
  ) {

    const id =
      Number(req.params.id);

    const proveedor =
      await this.service.getOne(id);

    return res.status(200).json({
      proveedor
    });
  }

  async create(
    req: Request,
    res: Response
  ) {

    const body =
      req.body as CreateProveedorDto;

    const proveedor =
      await this.service.create(body);

    return res.status(201).json({
      proveedor
    });
  }

  async updatePut(
    req: Request,
    res: Response
  ) {

    const id =
      Number(req.params.id);

    const body =
      req.body as UpdateProveedorDto;

    const proveedor =
      await this.service.updatePut(
        id,
        body
      );

    return res.status(200).json({
      proveedor
    });
  }

  async updatePatch(
    req: Request,
    res: Response
  ) {

    const id =
      Number(req.params.id);

    const body =
      req.body as PatchProveedorDto;

    const proveedor =
      await this.service.updatePatch(
        id,
        body
      );

    return res.status(200).json({
      proveedor
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
        "Proveedor eliminado correctamente"
    });
  }

  async deactivate(
    req: Request,
    res: Response
  ) {

    const id =
      Number(req.params.id);

    const proveedor =
      await this.service.deactivate(
        id
      );

    return res.status(200).json({
      proveedor
    });
  }
}
