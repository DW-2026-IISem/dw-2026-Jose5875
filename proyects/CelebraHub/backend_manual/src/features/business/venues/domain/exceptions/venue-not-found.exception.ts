import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception.js';

export class VenueNotFoundException extends EntityNotFoundException {
  constructor(id: number) {
    super('Salon', id);
  }
}
