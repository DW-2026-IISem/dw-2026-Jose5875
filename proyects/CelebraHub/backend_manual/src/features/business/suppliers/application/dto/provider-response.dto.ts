import { ApiProperty } from '@nestjs/swagger';

export class ProviderResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '900123456-7' })
  nit: string;

  @ApiProperty({ example: 'Decoraciones y Eventos del Caribe S.A.S.' })
  razonSocial: string;

  @ApiProperty({ example: 'Laura Gómez' })
  contacto: string;

  @ApiProperty({ example: '3001234567' })
  telefono: string;

  @ApiProperty({ example: 'contacto@decoracionescaribe.com' })
  email: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
