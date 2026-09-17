import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception.js';

export class ProviderNotFoundException extends EntityNotFoundException {
  constructor(id: number) {
    super('Proveedor', id);
  }
}
