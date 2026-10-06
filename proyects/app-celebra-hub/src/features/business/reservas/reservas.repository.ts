import { CreationAttributes } from "sequelize";
import { Reserva, ReservaI } from "./reserva.model";

export class ReservasRepository {

  async findAll(): Promise<Reserva[]> {
    return Reserva.findAll({
      order: [["id", "ASC"]]
    });
  }

  async findById(
    id: number
  ): Promise<Reserva | null> {
    return Reserva.findByPk(id);
  }

  async create(
    data: CreationAttributes<Reserva>
  ): Promise<Reserva> {
    return Reserva.create(data);
  }

  async update(
    reserva: Reserva,
    data: Partial<ReservaI>
  ): Promise<Reserva> {

    await reserva.update(data);

    return reserva;
  }

  async delete(
    reserva: Reserva
  ): Promise<void> {
    await reserva.destroy();
  }
}
