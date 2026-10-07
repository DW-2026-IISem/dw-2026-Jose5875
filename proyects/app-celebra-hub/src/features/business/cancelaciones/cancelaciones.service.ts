import { AppError } from "../../../shared/errors/app-error";
import { CancelacionesRepository } from "./cancelaciones.repository";
import {
  CreateCancelacionDto,
  PatchCancelacionDto,
  UpdateCancelacionDto,
} from "./dto";

export class CancelacionesService {
  private readonly repository =
    new CancelacionesRepository();

  async getAll() {
    return this.repository.findAll();
  }

  async getOne(id: number) {
    return this.findOrFail(id);
  }

  async create(data: CreateCancelacionDto) {
    return this.repository.create({
      nombre: data.nombre,
      descripcion: data.descripcion,
      is_active: data.is_active ?? true,
    });
  }

  async updatePut(
    id: number,
    data: UpdateCancelacionDto
  ) {
    const cancelacion = await this.findOrFail(id);

    return this.repository.update(
      cancelacion,
      data
    );
  }

  async updatePatch(
    id: number,
    data: PatchCancelacionDto
  ) {
    const cancelacion = await this.findOrFail(id);

    return this.repository.update(
      cancelacion,
      data
    );
  }

  async deletePhysical(id: number) {
    const cancelacion = await this.findOrFail(id);

    await this.repository.delete(cancelacion);
  }

  private async findOrFail(id: number) {
    const cancelacion =
      await this.repository.findById(id);

    if (!cancelacion) {
      throw new AppError(
        404,
        "Cancelación no encontrada"
      );
    }

    return cancelacion;
  }
}
