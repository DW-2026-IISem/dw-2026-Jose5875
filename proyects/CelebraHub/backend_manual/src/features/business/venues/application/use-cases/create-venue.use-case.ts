import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
