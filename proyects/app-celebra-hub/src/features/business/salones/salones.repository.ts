import { CreationAttributes } from "sequelize";
import { Salon, SalonI } from "./salon.model";

export class SalonesRepository {

  public async findAllActive(): Promise<Salon[]> {
    return Salon.findAll({
      where: {
        is_active: true
      }
    });
  }

  public async findById(
    id: number
  ): Promise<Salon | null> {
    return Salon.findByPk(id);
  }

  public async create(
    data: CreationAttributes<Salon>
  ): Promise<Salon> {
    return Salon.create(data);
  }

  public async update(
    salon: Salon,
    data: Partial<SalonI>
  ): Promise<Salon> {
    return salon.update(data);
  }

  public async delete(
    salon: Salon
  ): Promise<void> {
    await salon.destroy();
  }
}
