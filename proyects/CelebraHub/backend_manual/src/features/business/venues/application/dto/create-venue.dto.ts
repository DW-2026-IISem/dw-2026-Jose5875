import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVenueDto {
  @ApiProperty({ example: 'Salón Caribe Grand' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @ApiPropertyOptional({ example: 'Salón principal, capacidad 300 personas.' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}
