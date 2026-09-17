export const VALID_DOCUMENT_TYPES = ['CC', 'CE', 'TI', 'NIT', 'PASAPORTE'] as const;

export function isValidDocumentType(tipoDocumento: string): boolean {
  return (VALID_DOCUMENT_TYPES as readonly string[]).includes(tipoDocumento);
}

export function isValidDocumentNumber(numeroDocumento: string): boolean {
  const documentRegex = /^[A-Za-z0-9-]{5,20}$/;
  return documentRegex.test(numeroDocumento?.trim() ?? '');
}
