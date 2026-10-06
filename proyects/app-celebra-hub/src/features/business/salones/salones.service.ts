import { AppError } from "../../../shared/errors/app-error";
import {
  CreateSalonDto,
  PatchSalonDto,
  UpdateSalonDto,
  toSalonResponse
} from "./dto";
import { SalonesRepository } from "./salones.repository";

export class SalonesService {

  private repository: SalonesRepository =
    new SalonesRepository();

  public async getAll() {
    const salones =
      await this.repository.findAllActive();

    return salones.map(toSalonResponse);
  }

  public async getOne(id: number) {

    const salon =
      await this.findOrFail(id);

    return toSalonResponse(salon);
  }

  public async create(
    body: CreateSalonDto
  ) {

    const salon =
      await this.repository.create({
        nombre: body.nombre,
        descripcion:
          body.descripcion ?? null,
        is_active:
          body.is_active ?? true
      });

    return toSalonResponse(salon);
  }

  public async updatePut(
    id: number,
    body: UpdateSalonDto
  ) {

    const salon =
      await this.findOrFail(id);

    await this.repository.update(
      salon,
      {
        nombre: body.nombre,
        descripcion:
          body.descripcion ?? null,
        is_active:
          body.is_active ?? true
      }
    );

    return toSalonResponse(salon);
  }

  public async updatePatch(
    id: number,
    body: PatchSalonDto
  ) {

    const salon =
      await this.findOrFail(id);

    await this.repository.update(
      salon,
      body
    );

    return toSalonResponse(salon);
  }

  public async deletePhysical(
    id: number
  ): Promise<void> {

    const salon =
      await this.findOrFail(id);

    await this.repository.delete(salon);
  }

  public async deactivate(
    id: number
  ) {

    const salon =
      await this.findOrFail(id);

    await this.repository.update(
      salon,
      {
        is_active: false
      }
    );

    return toSalonResponse(salon);
  }

  private async findOrFail(id: number) {

    const salon =
      await this.repository.findById(id);

    if (!salon || !salon.is_active) {
      throw new AppError(
        404,
        "Salón no encontrado"
      );
    }

    return salon;
  }
}
