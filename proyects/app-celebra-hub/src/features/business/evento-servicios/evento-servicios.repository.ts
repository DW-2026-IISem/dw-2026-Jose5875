import {
  CreationAttributes
} from "sequelize";

import {
  EventoServicio,
  EventoServicioI
} from "./evento-servicio.model";

export class EventoServiciosRepository {

  public async findAllActive():
    Promise<EventoServicio[]> {

    return EventoServicio.findAll({
      where: {
        estado: "pendiente"
      }
    });
  }

  public async findById(
    id: number
  ): Promise<EventoServicio | null> {

    return EventoServicio.findByPk(id);
  }

  public async create(
    data: CreationAttributes<EventoServicio>
  ): Promise<EventoServicio> {

    return EventoServicio.create(data);
  }

  public async update(
    eventoServicio: EventoServicio,
    data: Partial<EventoServicioI>
  ): Promise<EventoServicio> {

    return eventoServicio.update(data);
  }

  public async delete(
    eventoServicio: EventoServicio
  ): Promise<void> {

    await eventoServicio.destroy();
  }
}
