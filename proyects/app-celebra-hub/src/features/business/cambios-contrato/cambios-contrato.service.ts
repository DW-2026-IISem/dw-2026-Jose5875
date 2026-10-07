import { AppError } from "../../../shared/errors/app-error";
import { CambiosContratoRepository } from "./cambios-contrato.repository";
import {
  CreateCambioContratoDto,
  PatchCambioContratoDto,
  UpdateCambioContratoDto,
} from "./dto";

export class CambiosContratoService {
  private readonly repository =
    new CambiosContratoRepository();

  async getAll() {
    return this.repository.findAll();
  }

  async getOne(id: number) {
    return this.findOrFail(id);
  }

  async create(data: CreateCambioContratoDto) {
    return this.repository.create({
      nombre: data.nombre,
      descripcion: data.descripcion,
      is_active: data.is_active ?? true,
    });
  }

  async updatePut(
    id: number,
    data: UpdateCambioContratoDto
  ) {
    const cambioContrato = await this.findOrFail(id);

    return this.repository.update(
      cambioContrato,
      data
    );
  }

  async updatePatch(
    id: number,
    data: PatchCambioContratoDto
  ) {
    const cambioContrato = await this.findOrFail(id);

    return this.repository.update(
      cambioContrato,
      data
    );
  }

  async deletePhysical(id: number) {
    const cambioContrato = await this.findOrFail(id);

    await this.repository.delete(cambioContrato);
  }

  private async findOrFail(id: number) {
    const cambioContrato =
      await this.repository.findById(id);

    if (!cambioContrato) {
      throw new AppError(
        404,
        "Cambio de contrato no encontrado"
      );
    }

    return cambioContrato;
  }
}
