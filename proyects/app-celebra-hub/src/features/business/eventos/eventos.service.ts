import { AppError } from "../../../shared/errors/app-error";
import {
  CreateEventoDto,
  PatchEventoDto,
  UpdateEventoDto,
} from "./dto";
import { Evento } from "./evento.model";
import { EventosRepository } from "./eventos.repository";

export class EventosService {
  private readonly repository = new EventosRepository();

  async getAll(): Promise<Evento[]> {
    return this.repository.findAll();
  }

  async getOne(id: number): Promise<Evento> {
    return this.findOrFail(id);
  }

  async create(data: CreateEventoDto): Promise<Evento> {
    return this.repository.create(data);
  }

  async updatePut(
    id: number,
    data: UpdateEventoDto
  ): Promise<Evento> {
    const evento = await this.findOrFail(id);
    return this.repository.update(evento, data);
  }

  async updatePatch(
    id: number,
    data: PatchEventoDto
  ): Promise<Evento> {
    const evento = await this.findOrFail(id);
    return this.repository.update(evento, data);
  }

  async deletePhysical(id: number): Promise<void> {
    const evento = await this.findOrFail(id);
    await this.repository.delete(evento);
  }

  private async findOrFail(id: number): Promise<Evento> {
    const evento = await this.repository.findById(id);

    if (!evento) {
      throw new AppError(404, "Evento no encontrado");
    }

    return evento;
  }
}
