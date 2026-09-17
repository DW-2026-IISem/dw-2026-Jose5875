import { ApiProperty } from '@nestjs/swagger';

export class ClientResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'CC' })
  tipoDocumento: string;

  @ApiProperty({ example: '1121876543' })
  numeroDocumento: string;

  @ApiProperty({ example: 'María Fernanda Pérez' })
  nombre: string;

  @ApiProperty({ example: '3011234567' })
  telefono: string;

  @ApiProperty({ example: 'maria.perez@example.com' })
  email: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
