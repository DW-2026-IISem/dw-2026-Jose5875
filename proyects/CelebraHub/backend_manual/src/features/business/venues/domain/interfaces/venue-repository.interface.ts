import { PaginatedResult } from '../../../../../common/interfaces/pagination.interface.js';
import { Venue } from '../entities/venue.entity.js';

export const VENUE_REPOSITORY = 'VENUE_REPOSITORY';

export interface VenueFindAllParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface IVenueRepository {
  create(venue: Venue): Promise<Venue>;
  update(venue: Venue): Promise<Venue>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<Venue | null>;
  findAll(params: VenueFindAllParams): Promise<PaginatedResult<Venue>>;
}
