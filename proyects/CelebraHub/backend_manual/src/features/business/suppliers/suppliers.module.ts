import { Module } from '@nestjs/common';
import { PROVIDER_REPOSITORY } from './domain/interfaces/provider-repository.interface.js';
import { ProviderRepository } from './infrastructure/persistence/repositories/provider.repository.js';
import { CreateProviderUseCase } from './application/use-cases/create-provider.use-case.js';
import { UpdateProviderUseCase } from './application/use-cases/update-provider.use-case.js';
import { DeleteProviderUseCase } from './application/use-cases/delete-provider.use-case.js';
import { GetProviderUseCase } from './application/use-cases/get-provider.use-case.js';
import { ListProvidersUseCase } from './application/use-cases/list-providers.use-case.js';
import { ProvidersController } from './presentation/http/controllers/providers.controller.js';

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
