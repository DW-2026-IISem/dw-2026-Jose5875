import { AppError } from "../../../shared/errors/app-error";

import {
  CreateProveedorDto,
  PatchProveedorDto,
  UpdateProveedorDto,
  toProveedorResponse
} from "./dto";

import { ProveedoresRepository } from "./proveedores.repository";

export class ProveedoresService {

  private repository =
    new ProveedoresRepository();

  async getAll() {

    const proveedores =
      await this.repository.findAllActive();

    return proveedores.map(
      toProveedorResponse
    );
  }

  async getOne(id: number) {

    const proveedor =
      await this.findOrFail(id);

    return toProveedorResponse(
      proveedor
    );
  }

  async create(
    body: CreateProveedorDto
  ) {

    const existing =
      await this.repository.findByNit(
        body.nit
      );

    if (existing) {
      throw new AppError(
        409,
        "Ya existe un proveedor con ese NIT"
      );
    }

    const proveedor =
      await this.repository.create({
        nit: body.nit,
        razon_social:
          body.razon_social,
        contacto:
          body.contacto,
        telefono:
          body.telefono,
        email:
          body.email,
        is_active:
          body.is_active ?? true
      });

    return toProveedorResponse(
      proveedor
    );
  }

  async updatePut(
    id: number,
    body: UpdateProveedorDto
  ) {

    const proveedor =
      await this.findOrFail(id);

    const existing =
      await this.repository.findByNit(
        body.nit
      );

    if (
      existing &&
      existing.id !== proveedor.id
    ) {
      throw new AppError(
        409,
        "Ya existe un proveedor con ese NIT"
      );
    }

    const updated =
      await this.repository.update(
        proveedor,
        {
          nit: body.nit,
          razon_social:
            body.razon_social,
          contacto:
            body.contacto,
          telefono:
            body.telefono,
          email:
            body.email,
          is_active:
            body.is_active
        }
      );

    return toProveedorResponse(
      updated
    );
  }

  async updatePatch(
    id: number,
    body: PatchProveedorDto
  ) {

    const proveedor =
      await this.findOrFail(id);

    if (body.nit) {

      const existing =
        await this.repository.findByNit(
          body.nit
        );

      if (
        existing &&
        existing.id !== proveedor.id
      ) {
        throw new AppError(
          409,
          "Ya existe un proveedor con ese NIT"
        );
      }
    }

    const updated =
      await this.repository.update(
        proveedor,
        body
      );

    return toProveedorResponse(
      updated
    );
  }

  async deletePhysical(
    id: number
  ): Promise<void> {

    const proveedor =
      await this.findOrFail(id);

    await this.repository.delete(
      proveedor
    );
  }

  async deactivate(
    id: number
  ) {

    const proveedor =
      await this.findOrFail(id);

    const updated =
      await this.repository.update(
        proveedor,
        {
          is_active: false
        }
      );

    return toProveedorResponse(
      updated
    );
  }

  private async findOrFail(
    id: number
  ) {

    const proveedor =
      await this.repository.findById(id);

    if (
      !proveedor ||
      !proveedor.is_active
    ) {
      throw new AppError(
        404,
        "Proveedor no encontrado"
      );
    }

    return proveedor;
  }
}
