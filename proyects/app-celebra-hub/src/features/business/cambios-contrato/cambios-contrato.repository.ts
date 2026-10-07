import { CreationAttributes } from "sequelize";
import {
  CambioContrato,
  CambioContratoI,
} from "./cambio-contrato.model";

export class CambiosContratoRepository {
  async findAll(): Promise<CambioContrato[]> {
    return CambioContrato.findAll({
      order: [["id", "ASC"]],
    });
  }

  async findById(id: number): Promise<CambioContrato | null> {
    return CambioContrato.findByPk(id);
  }

  async create(
    data: CreationAttributes<CambioContrato>
  ): Promise<CambioContrato> {
    return CambioContrato.create(data);
  }

  async update(
    cambioContrato: CambioContrato,
    data: Partial<CambioContratoI>
  ): Promise<CambioContrato> {
    await cambioContrato.update(data);
    return cambioContrato;
  }

  async delete(
    cambioContrato: CambioContrato
  ): Promise<void> {
    await cambioContrato.destroy();
  }
}
