import { CreationAttributes } from "sequelize";
import {
  Cancelacion,
  CancelacionI,
} from "./cancelacion.model";

export class CancelacionesRepository {
  async findAll(): Promise<Cancelacion[]> {
    return Cancelacion.findAll({
      order: [["id", "ASC"]],
    });
  }

  async findById(id: number): Promise<Cancelacion | null> {
    return Cancelacion.findByPk(id);
  }

  async create(
    data: CreationAttributes<Cancelacion>
  ): Promise<Cancelacion> {
    return Cancelacion.create(data);
  }

  async update(
    cancelacion: Cancelacion,
    data: Partial<CancelacionI>
  ): Promise<Cancelacion> {
    await cancelacion.update(data);
    return cancelacion;
  }

  async delete(
    cancelacion: Cancelacion
  ): Promise<void> {
    await cancelacion.destroy();
  }
}
