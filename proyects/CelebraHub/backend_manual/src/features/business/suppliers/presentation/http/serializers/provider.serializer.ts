import { Provider } from '../../../domain/entities/provider.entity';
import { ProviderResponseDto } from '../../../application/dto/provider-response.dto';
import { ProviderMapper } from '../../../application/mappers/provider.mapper';

export class ProviderSerializer {
  static serialize(entity: Provider): ProviderResponseDto {
    return ProviderMapper.toResponse(entity);
  }
}
