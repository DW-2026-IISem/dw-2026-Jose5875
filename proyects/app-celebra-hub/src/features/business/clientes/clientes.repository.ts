import {
  CreationAttributes,
  Transaction
} from "sequelize";

import {
  Cliente,
  ClienteI
} from "./cliente.model";

export class ClientesRepository {

  // ================== READ ==================

  public async findAllActive(): Promise<Cliente[]> {
    return Cliente.findAll({
      where: {
        is_active: true
      }
    });
  }

  public async findById(
    id: number,
    transaction?: Transaction
  ): Promise<Cliente | null> {
    return Cliente.findByPk(id, {
      transaction
    });
  }

  // ================== CREATE ==================

  public async create(
    data: CreationAttributes<Cliente>
  ): Promise<Cliente> {
    return Cliente.create(data);
  }

  // ================== UPDATE ==================

  public async update(
    cliente: Cliente,
    data: Partial<ClienteI>
  ): Promise<Cliente> {
    return cliente.update(data);
  }

  // ================== DELETE ==================

  public async delete(
    cliente: Cliente
  ): Promise<void> {
    await cliente.destroy();
  }
}
