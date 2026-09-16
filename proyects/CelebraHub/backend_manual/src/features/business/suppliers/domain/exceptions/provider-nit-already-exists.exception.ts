import { DomainException } from '../../../../../common/exceptions/domain.exception';

export class ProviderNitAlreadyExistsException extends DomainException {
  constructor(nit: string) {
    super(`El NIT '${nit}' ya está registrado`);
  }
}
