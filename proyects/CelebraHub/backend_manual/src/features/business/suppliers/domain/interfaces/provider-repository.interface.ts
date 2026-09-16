import { PaginatedResult } from '../../../../../common/interfaces/pagination.interface';
import { Provider } from '../entities/provider.entity';

export const PROVIDER_REPOSITORY = 'PROVIDER_REPOSITORY';

export interface ProviderFindAllParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface IProviderRepository {
  create(provider: Provider): Promise<Provider>;
  update(provider: Provider): Promise<Provider>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<Provider | null>;
  findByNit(nit: string): Promise<Provider | null>;
  findAll(params: ProviderFindAllParams): Promise<PaginatedResult<Provider>>;
}
