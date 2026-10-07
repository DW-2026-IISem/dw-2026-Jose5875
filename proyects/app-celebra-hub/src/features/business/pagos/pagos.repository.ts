import { CreationAttributes } from "sequelize";
import { Pago, PagoI } from "./pago.model";

export class PagosRepository {
  async findAll(): Promise<Pago[]> {
    return Pago.findAll({
      order: [["id", "ASC"]],
    });
  }

  async findById(id: number): Promise<Pago | null> {
    return Pago.findByPk(id);
  }

  async create(data: CreationAttributes<Pago>): Promise<Pago> {
    return Pago.create(data);
  }

  async update(
    pago: Pago,
    data: Partial<PagoI>
  ): Promise<Pago> {
    await pago.update(data);
    return pago;
  }

  async delete(pago: Pago): Promise<void> {
    await pago.destroy();
  }
}
