import { Inject, Injectable } from '@nestjs/common';
import { ClientDocumentAlreadyExistsException } from '../../domain/exceptions/client-document-already-exists.exception.js';
import { Client } from '../../domain/entities/client.entity.js';
import {
  CLIENT_REPOSITORY,
  type IClientRepository,
} from '../../domain/interfaces/client-repository.interface.js';
import { CreateClientDto } from '../dto/create-client.dto.js';
import { ClientMapper } from '../mappers/client.mapper.js';

@Injectable()
export class CreateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
  ) {}

  async execute(dto: CreateClientDto) {
    const existing = await this.clientRepository.findByDocumento(
      dto.numeroDocumento,
    );
    if (existing) {
      throw new ClientDocumentAlreadyExistsException(dto.numeroDocumento);
    }

    const client = Client.create({
      tipoDocumento: dto.tipoDocumento,
      numeroDocumento: dto.numeroDocumento,
      nombre: dto.nombre,
      telefono: dto.telefono,
      email: dto.email,
    });

    const created = await this.clientRepository.create(client);
    return ClientMapper.toResponse(created);
  }
}
