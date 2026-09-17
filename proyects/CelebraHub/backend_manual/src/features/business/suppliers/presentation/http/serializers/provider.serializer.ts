import { Provider } from '../../../domain/entities/provider.entity.js';
import { ProviderResponseDto } from '../../../application/dto/provider-response.dto.js';
import { ProviderMapper } from '../../../application/mappers/provider.mapper.js';

export class ProviderSerializer {
  static serialize(entity: Provider): ProviderResponseDto {
    return ProviderMapper.toResponse(entity);
  }
}
