import { AppError } from "../../../shared/errors/app-error";
import { PagosRepository } from "./pagos.repository";
import {
  CreatePagoDto,
  PatchPagoDto,
  UpdatePagoDto,
} from "./dto";

export class PagosService {
  private readonly repository = new PagosRepository();

  async getAll() {
    return this.repository.findAll();
  }

  async getOne(id: number) {
    return this.findOrFail(id);
  }

  async create(data: CreatePagoDto) {
    this.validateMonto(data.monto);

    return this.repository.create({
      referencia_tipo: data.referencia_tipo,
      referencia_id: data.referencia_id,
      metodo: data.metodo,
      monto: data.monto,
      fecha: data.fecha,
      estado: data.estado,
    });
  }

  async updatePut(id: number, data: UpdatePagoDto) {
    this.validateMonto(data.monto);

    const pago = await this.findOrFail(id);

    return this.repository.update(pago, data);
  }

  async updatePatch(id: number, data: PatchPagoDto) {
    if (data.monto !== undefined) {
      this.validateMonto(data.monto);
    }

    const pago = await this.findOrFail(id);

    return this.repository.update(pago, data);
  }

  async deletePhysical(id: number) {
    const pago = await this.findOrFail(id);

    await this.repository.delete(pago);
  }

  private async findOrFail(id: number) {
    const pago = await this.repository.findById(id);

    if (!pago) {
      throw new AppError(404, "Pago no encontrado");
    }

    return pago;
  }

  private validateMonto(monto: number) {
    if (monto < 0) {
      throw new AppError(
        400,
        "El monto del pago no puede ser negativo"
      );
    }
  }
}
