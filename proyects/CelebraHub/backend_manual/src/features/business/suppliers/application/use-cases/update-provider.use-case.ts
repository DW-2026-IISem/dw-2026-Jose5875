import { Inject, Injectable } from '@nestjs/common';
import { ProviderNitAlreadyExistsException } from '../../domain/exceptions/provider-nit-already-exists.exception';
import { ProviderNotFoundException } from '../../domain/exceptions/provider-not-found.exception';
import {
  PROVIDER_REPOSITORY,
  type IProviderRepository,
} from '../../domain/interfaces/provider-repository.interface';
import { UpdateProviderDto } from '../dto/update-provider.dto';
import { ProviderMapper } from '../mappers/provider.mapper';

@Injectable()
export class UpdateProviderUseCase {
  constructor(
    @Inject(PROVIDER_REPOSITORY)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(id: number, dto: UpdateProviderDto) {
    const provider = await this.providerRepository.findById(id);
    if (!provider) {
      throw new ProviderNotFoundException(id);
    }

    if (dto.nit && dto.nit !== provider.nit) {
      const existing = await this.providerRepository.findByNit(dto.nit);
      if (existing) {
        throw new ProviderNitAlreadyExistsException(dto.nit);
      }
    }

    provider.update(dto);
    const updated = await this.providerRepository.update(provider);
    return ProviderMapper.toResponse(updated);
  }
}
