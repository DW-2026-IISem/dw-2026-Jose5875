import { CreationAttributes } from "sequelize";

import {
  Contrato,
  ContratoI
} from "./contrato.model";

export class ContratosRepository {

  async findAll(): Promise<Contrato[]> {
    return Contrato.findAll({
      order: [["id", "ASC"]]
    });
  }

  async findById(
    id: number
  ): Promise<Contrato | null> {
    return Contrato.findByPk(id);
  }

  async findByNumero(
    numero: string
  ): Promise<Contrato | null> {
    return Contrato.findOne({
      where: { numero }
    });
  }

  async create(
    data: CreationAttributes<Contrato>
  ): Promise<Contrato> {
    return Contrato.create(data);
  }

  async update(
    contrato: Contrato,
    data: Partial<ContratoI>
  ): Promise<Contrato> {

    await contrato.update(data);

    return contrato;
  }

  async delete(
    contrato: Contrato
  ): Promise<void> {
    await contrato.destroy();
  }
}
