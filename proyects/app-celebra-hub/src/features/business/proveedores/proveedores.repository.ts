import { CreationAttributes } from "sequelize";

import {
  Proveedor,
  ProveedorI
} from "./proveedor.model";

export class ProveedoresRepository {

  async findAllActive(): Promise<Proveedor[]> {
    return Proveedor.findAll({
      where: {
        is_active: true
      },
      order: [["id", "ASC"]]
    });
  }

  async findById(
    id: number
  ): Promise<Proveedor | null> {
    return Proveedor.findByPk(id);
  }

  async findByNit(
    nit: string
  ): Promise<Proveedor | null> {
    return Proveedor.findOne({
      where: { nit }
    });
  }

  async create(
    data: CreationAttributes<Proveedor>
  ): Promise<Proveedor> {
    return Proveedor.create(data);
  }

  async update(
    proveedor: Proveedor,
    data: Partial<ProveedorI>
  ): Promise<Proveedor> {

    await proveedor.update(data);

    return proveedor;
  }

  async delete(
    proveedor: Proveedor
  ): Promise<void> {
    await proveedor.destroy();
  }
}
