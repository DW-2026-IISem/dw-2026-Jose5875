import { Inject, Injectable } from '@nestjs/common';
import { ProviderNitAlreadyExistsException } from '../../domain/exceptions/provider-nit-already-exists.exception';
import { Provider } from '../../domain/entities/provider.entity';
import {
  PROVIDER_REPOSITORY,
  type IProviderRepository,
} from '../../domain/interfaces/provider-repository.interface';
import { CreateProviderDto } from '../dto/create-provider.dto';
import { ProviderMapper } from '../mappers/provider.mapper';

@Injectable()
export class CreateProviderUseCase {
  constructor(
    @Inject(PROVIDER_REPOSITORY)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(dto: CreateProviderDto) {
    const existing = await this.providerRepository.findByNit(dto.nit);
    if (existing) {
      throw new ProviderNitAlreadyExistsException(dto.nit);
    }

    const provider = Provider.create({
      nit: dto.nit,
      razonSocial: dto.razonSocial,
      contacto: dto.contacto,
      telefono: dto.telefono,
      email: dto.email,
    });

    const created = await this.providerRepository.create(provider);
    return ProviderMapper.toResponse(created);
  }
}
