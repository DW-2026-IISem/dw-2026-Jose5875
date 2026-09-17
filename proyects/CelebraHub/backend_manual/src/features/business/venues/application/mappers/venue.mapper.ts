import { Venue } from '../../domain/entities/venue.entity.js';
import { VenueResponseDto } from '../dto/venue-response.dto.js';
import { VenueModel } from '../../infrastructure/persistence/models/venue.model.js';

export class VenueMapper {
  static toDomain(model: VenueModel): Venue {
    return Venue.reconstitute({
      id: model.id,
      nombre: model.nombre,
      descripcion: model.descripcion ?? undefined,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toResponse(entity: Venue): VenueResponseDto {
    return {
      id: entity.id!,
      nombre: entity.nombre,
      descripcion: entity.descripcion,
      isActive: entity.isActive,
      createdAt: entity.createdAt!,
      updatedAt: entity.updatedAt!,
    };
  }

  static toPersistence(entity: Venue): Partial<VenueModel> {
    return {
      id: entity.id,
      nombre: entity.nombre,
      descripcion: entity.descripcion ?? null,
      isActive: entity.isActive ?? true,
    };
  }
}
