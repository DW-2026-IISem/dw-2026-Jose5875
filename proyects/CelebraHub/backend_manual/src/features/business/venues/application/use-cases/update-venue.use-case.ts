import { Inject, Injectable } from '@nestjs/common';
import { VenueNotFoundException } from '../../domain/exceptions/venue-not-found.exception.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { UpdateVenueDto } from '../dto/update-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class UpdateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(id: number, dto: UpdateVenueDto) {
    const venue = await this.venueRepository.findById(id);
    if (!venue) {
      throw new VenueNotFoundException(id);
    }

    venue.update(dto);
    const updated = await this.venueRepository.update(venue);
    return VenueMapper.toResponse(updated);
  }
}
