import { Module } from '@nestjs/common';
import { PROVIDER_REPOSITORY } from './domain/interfaces/provider-repository.interface';
import { ProviderRepository } from './infrastructure/persistence/repositories/provider.repository';
import { CreateProviderUseCase } from './application/use-cases/create-provider.use-case';
import { UpdateProviderUseCase } from './application/use-cases/update-provider.use-case';
import { DeleteProviderUseCase } from './application/use-cases/delete-provider.use-case';
import { GetProviderUseCase } from './application/use-cases/get-provider.use-case';
import { ListProvidersUseCase } from './application/use-cases/list-providers.use-case';
import { ProvidersController } from './presentation/http/controllers/providers.controller';

@Module({
  controllers: [ProvidersController],
  providers: [
    ProviderRepository,
    { provide: PROVIDER_REPOSITORY, useExisting: ProviderRepository },
    CreateProviderUseCase,
    UpdateProviderUseCase,
    DeleteProviderUseCase,
    GetProviderUseCase,
    ListProvidersUseCase,
  ],
  exports: [PROVIDER_REPOSITORY],
})
export class SuppliersModule {}
