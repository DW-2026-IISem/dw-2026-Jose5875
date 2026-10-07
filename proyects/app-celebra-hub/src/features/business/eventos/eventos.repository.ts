import { CreationAttributes } from "sequelize";
import { Evento, EventoI } from "./evento.model";

export class EventosRepository {
  async findAll(): Promise<Evento[]> {
    return Evento.findAll({
      order: [["id", "ASC"]],
    });
  }

  async findById(id: number): Promise<Evento | null> {
    return Evento.findByPk(id);
  }

  async create(data: CreationAttributes<Evento>): Promise<Evento> {
    return Evento.create(data);
  }

  async update(
    evento: Evento,
    data: Partial<EventoI>
  ): Promise<Evento> {
    await evento.update(data);
    return evento;
  }

  async delete(evento: Evento): Promise<void> {
    await evento.destroy();
  }
}
