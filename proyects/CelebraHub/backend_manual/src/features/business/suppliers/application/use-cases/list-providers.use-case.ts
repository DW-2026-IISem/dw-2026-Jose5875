import { Inject, Injectable } from '@nestjs/common';
import {
  PROVIDER_REPOSITORY,
  type IProviderRepository,
} from '../../domain/interfaces/provider-repository.interface.js';
import { ProviderFilterDto } from '../dto/provider-filter.dto.js';
import { ProviderMapper } from '../mappers/provider.mapper.js';

@Injectable()
export class ListProvidersUseCase {
  constructor(
    @Inject(PROVIDER_REPOSITORY)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(filter: ProviderFilterDto) {
    const result = await this.providerRepository.findAll(filter);
    return {
      items: result.items.map((provider) => ProviderMapper.toResponse(provider)),
      meta: result.meta,
    };
  }
}
