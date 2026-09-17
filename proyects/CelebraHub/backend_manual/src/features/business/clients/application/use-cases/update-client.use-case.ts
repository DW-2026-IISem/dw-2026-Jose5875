import { Inject, Injectable } from '@nestjs/common';
import { ClientDocumentAlreadyExistsException } from '../../domain/exceptions/client-document-already-exists.exception.js';
import { ClientNotFoundException } from '../../domain/exceptions/client-not-found.exception.js';
import {
  CLIENT_REPOSITORY,
  type IClientRepository,
} from '../../domain/interfaces/client-repository.interface.js';
import { UpdateClientDto } from '../dto/update-client.dto.js';
import { ClientMapper } from '../mappers/client.mapper.js';

@Injectable()
export class UpdateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
  ) {}

  async execute(id: number, dto: UpdateClientDto) {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new ClientNotFoundException(id);
    }

    if (dto.numeroDocumento && dto.numeroDocumento !== client.numeroDocumento) {
      const existing = await this.clientRepository.findByDocumento(
        dto.numeroDocumento,
      );
      if (existing) {
        throw new ClientDocumentAlreadyExistsException(dto.numeroDocumento);
      }
    }

    client.update(dto);
    const updated = await this.clientRepository.update(client);
    return ClientMapper.toResponse(updated);
  }
}
