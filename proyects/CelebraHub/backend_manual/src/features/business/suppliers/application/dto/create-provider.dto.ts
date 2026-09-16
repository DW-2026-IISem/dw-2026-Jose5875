import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateProviderDto {
  @ApiProperty({ example: '900123456-7' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^\d{5,15}(-\d)?$/, {
    message: 'El NIT no tiene un formato válido',
  })
  nit: string;

  @ApiProperty({ example: 'Decoraciones y Eventos del Caribe S.A.S.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  razonSocial: string;

  @ApiProperty({ example: 'Laura Gómez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  contacto: string;

  @ApiProperty({ example: '3001234567' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^\+?\d{7,15}$/, {
    message: 'El teléfono no tiene un formato válido',
  })
  telefono: string;

  @ApiProperty({ example: 'contacto@decoracionescaribe.com' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email: string;
}
