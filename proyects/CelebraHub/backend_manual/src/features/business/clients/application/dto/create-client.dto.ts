import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { VALID_DOCUMENT_TYPES } from '../../domain/validators/client-document.validator.js';

export class CreateClientDto {
  @ApiProperty({ example: 'CC', enum: VALID_DOCUMENT_TYPES })
  @IsString()
  @IsIn(VALID_DOCUMENT_TYPES as unknown as string[])
  tipoDocumento: string;

  @ApiProperty({ example: '1121876543' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9-]{5,20}$/, {
    message: 'El número de documento no tiene un formato válido',
  })
  numeroDocumento: string;

  @ApiProperty({ example: 'María Fernanda Pérez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @ApiProperty({ example: '3011234567' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^\+?\d{7,15}$/, {
    message: 'El teléfono no tiene un formato válido',
  })
  telefono: string;

  @ApiProperty({ example: 'maria.perez@example.com' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email: string;
}
