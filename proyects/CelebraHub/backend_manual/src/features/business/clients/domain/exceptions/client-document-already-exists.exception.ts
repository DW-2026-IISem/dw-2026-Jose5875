import { DomainException } from '../../../../../common/exceptions/domain.exception.js';

export class ClientDocumentAlreadyExistsException extends DomainException {
  constructor(numeroDocumento: string) {
    super(`El documento '${numeroDocumento}' ya está registrado`);
  }
}
