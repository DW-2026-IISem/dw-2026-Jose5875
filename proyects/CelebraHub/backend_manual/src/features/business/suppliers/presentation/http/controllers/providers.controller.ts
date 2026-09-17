import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ParsePositiveIntPipe } from '../../../../../../common/pipes/parse-positive-int.pipe.js';
import { CreateProviderDto } from '../../../application/dto/create-provider.dto.js';
import { UpdateProviderDto } from '../../../application/dto/update-provider.dto.js';
import { ProviderFilterDto } from '../../../application/dto/provider-filter.dto.js';
import { ProviderResponseDto } from '../../../application/dto/provider-response.dto.js';
import { CreateProviderUseCase } from '../../../application/use-cases/create-provider.use-case.js';
import { UpdateProviderUseCase } from '../../../application/use-cases/update-provider.use-case.js';
import { DeleteProviderUseCase } from '../../../application/use-cases/delete-provider.use-case.js';
import { GetProviderUseCase } from '../../../application/use-cases/get-provider.use-case.js';
import { ListProvidersUseCase } from '../../../application/use-cases/list-providers.use-case.js';

@ApiTags('Providers')
@Controller('providers')
export class ProvidersController {
  constructor(
    private readonly createProviderUseCase: CreateProviderUseCase,
    private readonly updateProviderUseCase: UpdateProviderUseCase,
    private readonly deleteProviderUseCase: DeleteProviderUseCase,
    private readonly getProviderUseCase: GetProviderUseCase,
    private readonly listProvidersUseCase: ListProvidersUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un proveedor' })
  @ApiCreatedResponse({ type: ProviderResponseDto })
  create(@Body() dto: CreateProviderDto) {
    return this.createProviderUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar proveedores' })
  @ApiOkResponse({ type: [ProviderResponseDto] })
  findAll(@Query() filter: ProviderFilterDto) {
    return this.listProvidersUseCase.execute(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un proveedor por ID' })
  @ApiOkResponse({ type: ProviderResponseDto })
  findOne(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.getProviderUseCase.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un proveedor' })
  @ApiOkResponse({ type: ProviderResponseDto })
  update(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Body() dto: UpdateProviderDto,
  ) {
    return this.updateProviderUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un proveedor' })
  @ApiNoContentResponse()
  remove(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.deleteProviderUseCase.execute(id);
  }
}
