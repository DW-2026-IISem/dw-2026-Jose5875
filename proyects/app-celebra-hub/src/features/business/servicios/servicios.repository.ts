import { CreationAttributes } from "sequelize";
import { Servicio, ServicioI } from "./servicio.model";

export class ServiciosRepository {

  public async findAllActive(): Promise<Servicio[]> {
    return Servicio.findAll({
      where: {
        is_active: true
      }
    });
  }

  public async findById(
    id: number
  ): Promise<Servicio | null> {
    return Servicio.findByPk(id);
  }

  public async create(
    data: CreationAttributes<Servicio>
  ): Promise<Servicio> {
    return Servicio.create(data);
  }

  public async update(
    servicio: Servicio,
    data: Partial<ServicioI>
  ): Promise<Servicio> {
    return servicio.update(data);
  }

  public async delete(
    servicio: Servicio
  ): Promise<void> {
    await servicio.destroy();
  }
}
