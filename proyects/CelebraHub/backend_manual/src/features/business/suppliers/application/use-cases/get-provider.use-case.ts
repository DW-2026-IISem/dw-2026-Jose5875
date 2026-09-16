import { Inject, Injectable } from '@nestjs/common';
import { ProviderNotFoundException } from '../../domain/exceptions/provider-not-found.exception';
import {
  PROVIDER_REPOSITORY,
  type IProviderRepository,
} from '../../domain/interfaces/provider-repository.interface';
import { ProviderMapper } from '../mappers/provider.mapper';

@Injectable()
export class GetProviderUseCase {
  constructor(
    @Inject(PROVIDER_REPOSITORY)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(id: number) {
    const provider = await this.providerRepository.findById(id);
    if (!provider) {
      throw new ProviderNotFoundException(id);
    }

    return ProviderMapper.toResponse(provider);
  }
}
