## FASE 8 — `07_BUSINESS_CONTACTS`

### Business — Contacts / Contacto (patrón completo CA)

> **Objetivo de la fase:** Segunda entidad de negocio de EnlaceExpress: Contacto, que pertenece a una Empresa (`companyId`). Orden lógico: dominio → infraestructura → aplicación → presentación → módulo → cableado → verificación.

### 8.1 — features/shipping/contacts/domain/entities/contact.entity.ts

Entidad de dominio (TypeScript puro). No extiende Sequelize `Model`. Aquí viven las reglas del negocio.

**Archivo:** `src/features/shipping/contacts/domain/entities/contact.entity.ts`

```bash
mkdir -p src/features/shipping/contacts/domain/entities
cat > src/features/shipping/contacts/domain/entities/contact.entity.ts <<'EOF_BACKEND_IA'
import { isValidContactEmail } from '../validators/contact-email.validator.js';
import { isValidContactPhone } from '../validators/contact-phone.validator.js';

export interface ContactProps {
  id?: number;
  companyId: number;
  name: string;
  position?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Contact {
  id?: number;
  companyId: number;
  name: string;
  position?: string;
  phone?: string;
  email?: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  private constructor(props: ContactProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.name = props.name;
    this.position = props.position;
    this.phone = props.phone;
    this.email = props.email;
    this.isPrimary = props.isPrimary ?? false;
    this.isActive = props.isActive ?? true;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    props: Omit<ContactProps, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>,
  ): Contact {
    if (!props.companyId) {
      throw new Error('El contacto debe pertenecer a una empresa');
    }

    if (!props.name?.trim()) {
      throw new Error('El nombre del contacto es requerido');
    }

    if (props.email && !isValidContactEmail(props.email)) {
      throw new Error('El email del contacto no es válido');
    }

    if (props.phone && !isValidContactPhone(props.phone)) {
      throw new Error('El teléfono del contacto no es válido');
    }

    return new Contact(props);
  }

  static reconstitute(props: ContactProps): Contact {
    return new Contact(props);
  }

  update(
    props: Partial<
      Omit<ContactProps, 'id' | 'companyId' | 'isActive' | 'createdAt' | 'updatedAt'>
    >,
  ): void {
    if (props.name !== undefined) {
      if (!props.name.trim()) {
        throw new Error('El nombre del contacto es requerido');
      }
      this.name = props.name;
    }

    if (props.position !== undefined) {
      this.position = props.position;
    }

    if (props.phone !== undefined) {
      if (props.phone && !isValidContactPhone(props.phone)) {
        throw new Error('El teléfono del contacto no es válido');
      }
      this.phone = props.phone;
    }

    if (props.email !== undefined) {
      if (props.email && !isValidContactEmail(props.email)) {
        throw new Error('El email del contacto no es válido');
      }
      this.email = props.email;
    }

    if (props.isPrimary !== undefined) {
      this.isPrimary = props.isPrimary;
    }
  }

  deactivate(): void {
    this.isActive = false;
  }

  activate(): void {
    this.isActive = true;
  }
}
EOF_BACKEND_IA
```

![alt text](imagenes/contact.entity.png)

### 8.2 — features/shipping/contacts/domain/exceptions/contact-not-found.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/shipping/contacts/domain/exceptions/contact-not-found.exception.ts`

```bash
mkdir -p src/features/shipping/contacts/domain/exceptions
cat > src/features/shipping/contacts/domain/exceptions/contact-not-found.exception.ts <<'EOF_BACKEND_IA'
import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception.js';

export class ContactNotFoundException extends EntityNotFoundException {
  constructor(id: number) {
    super('Contacto', id);
  }
}
EOF_BACKEND_IA
```

![alt text](imagenes/contact-not-found.exception.png)

### 8.3 — features/shipping/contacts/domain/interfaces/contact-repository.interface.ts

Puerto (contrato) del repositorio. Incluye `clearPrimaryFlag` para la regla "un solo contacto principal por empresa".

**Archivo:** `src/features/shipping/contacts/domain/interfaces/contact-repository.interface.ts`

```bash
mkdir -p src/features/shipping/contacts/domain/interfaces
cat > src/features/shipping/contacts/domain/interfaces/contact-repository.interface.ts <<'EOF_BACKEND_IA'
import { PaginatedResult } from '../../../../../common/interfaces/pagination.interface.js';
import { Contact } from '../entities/contact.entity.js';

export const CONTACT_REPOSITORY = 'CONTACT_REPOSITORY';

export interface ContactFindAllParams {
  page?: number;
  limit?: number;
  search?: string;
  companyId?: number;
}

export interface IContactRepository {
  create(contact: Contact): Promise<Contact>;
  update(contact: Contact): Promise<Contact>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<Contact | null>;
  findAll(params: ContactFindAllParams): Promise<PaginatedResult<Contact>>;
  /** Quita el flag isPrimary de cualquier otro contacto de la misma empresa. */
  clearPrimaryFlag(companyId: number, excludeId?: number): Promise<void>;
}
EOF_BACKEND_IA
```

![alt text](imagenes/contact-repository.interface.png)

### 8.4 — features/shipping/contacts/domain/validators/contact-email.validator.ts

Validador de dominio reutilizable (reglas independientes del framework HTTP).

**Archivo:** `src/features/shipping/contacts/domain/validators/contact-email.validator.ts`

```bash
mkdir -p src/features/shipping/contacts/domain/validators
cat > src/features/shipping/contacts/domain/validators/contact-email.validator.ts <<'EOF_BACKEND_IA'
export function isValidContactEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
EOF_BACKEND_IA
```

![alt text](imagenes/ontact-email.validator.png)

### 8.5 — features/shipping/contacts/domain/validators/contact-phone.validator.ts

Validador de dominio reutilizable (reglas independientes del framework HTTP).

**Archivo:** `src/features/shipping/contacts/domain/validators/contact-phone.validator.ts`

```bash
mkdir -p src/features/shipping/contacts/domain/validators
cat > src/features/shipping/contacts/domain/validators/contact-phone.validator.ts <<'EOF_BACKEND_IA'
export function isValidContactPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;
  return phoneRegex.test(phone);
}
EOF_BACKEND_IA
```

![alt text](imagenes/contact-phone.validator.png)

### 8.6 — features/shipping/contacts/infrastructure/persistence/models/contact.model.ts

Modelo Sequelize (`@Table`). Incluye la FK real y `@BelongsTo(() => CompanyModel)`.

**Archivo:** `src/features/shipping/contacts/infrastructure/persistence/models/contact.model.ts`

```bash
mkdir -p src/features/shipping/contacts/infrastructure/persistence/models
cat > src/features/shipping/contacts/infrastructure/persistence/models/contact.model.ts <<'EOF_BACKEND_IA'
import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { CompanyModel } from '../../../../companies/infrastructure/persistence/models/company.model.js';

@Table({ tableName: 'contacts' })
export class ContactModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => CompanyModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare companyId: number;

  @BelongsTo(() => CompanyModel)
  declare company: CompanyModel;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare position: string | null;

  @Column({ type: DataType.STRING(30), allowNull: true })
  declare phone: string | null;

  @Column({ type: DataType.STRING(150), allowNull: true })
  declare email: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isPrimary: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isActive: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
EOF_BACKEND_IA
```

![alt text](imagenes/contact.model.png)

### 8.7 — features/shipping/contacts/infrastructure/persistence/repositories/contact.repository.ts

Adaptador del repositorio: implementa el puerto de dominio con Sequelize.

**Archivo:** `src/features/shipping/contacts/infrastructure/persistence/repositories/contact.repository.ts`

```bash
mkdir -p src/features/shipping/contacts/infrastructure/persistence/repositories
cat > src/features/shipping/contacts/infrastructure/persistence/repositories/contact.repository.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import {
  buildPaginatedResult,
  normalizePagination,
} from '../../../../../../common/utils/pagination.util.js';
import { Contact } from '../../../domain/entities/contact.entity.js';
import {
  ContactFindAllParams,
  IContactRepository,
} from '../../../domain/interfaces/contact-repository.interface.js';
import { ContactMapper } from '../../../application/mappers/contact.mapper.js';
import { ContactModel } from '../models/contact.model.js';

@Injectable()
export class ContactRepository implements IContactRepository {
  async create(contact: Contact): Promise<Contact> {
    const model = await ContactModel.create(
      ContactMapper.toPersistence(contact),
    );
    return ContactMapper.toDomain(model);
  }

  async update(contact: Contact): Promise<Contact> {
    await ContactModel.update(ContactMapper.toPersistence(contact), {
      where: { id: contact.id },
    });
    const updated = await ContactModel.findByPk(contact.id!);
    return ContactMapper.toDomain(updated!);
  }

  async delete(id: number): Promise<void> {
    await ContactModel.destroy({ where: { id } });
  }

  async findById(id: number): Promise<Contact | null> {
    const model = await ContactModel.findByPk(id);
    return model ? ContactMapper.toDomain(model) : null;
  }

  async findAll(params: ContactFindAllParams) {
    const { page, limit, offset } = normalizePagination(
      params.page,
      params.limit,
    );

    const where: Record<string, unknown> = {};

    if (params.companyId) {
      where.companyId = params.companyId;
    }

    if (params.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.like]: `%${params.search}%` } },
        { email: { [Op.like]: `%${params.search}%` } },
      ];
    }

    const { rows, count } = await ContactModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return buildPaginatedResult(
      rows.map((row) => ContactMapper.toDomain(row)),
      count,
      page,
      limit,
    );
  }

  async clearPrimaryFlag(companyId: number, excludeId?: number): Promise<void> {
    const where: Record<string, unknown> = { companyId, isPrimary: true };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    await ContactModel.update({ isPrimary: false }, { where });
  }
}
EOF_BACKEND_IA
```

![alt text](imagenes/contact.repository.png)

### 8.8 — features/shipping/contacts/infrastructure/persistence/migrations/create-contacts-table.migration.ts

Migración documental/auxiliar de la tabla. En dev el sync de Sequelize crea el esquema.

**Archivo:** `src/features/shipping/contacts/infrastructure/persistence/migrations/create-contacts-table.migration.ts`

```bash
mkdir -p src/features/shipping/contacts/infrastructure/persistence/migrations
cat > src/features/shipping/contacts/infrastructure/persistence/migrations/create-contacts-table.migration.ts <<'EOF_BACKEND_IA'
export const createContactsTableMigration = {
  name: 'create-contacts-table',
  async up(): Promise<void> {
    // Sequelize sync handles table creation in development.
    // Production: CREATE TABLE contacts (id, companyId FK->companies, name, position,
    //   phone, email, isPrimary, isActive, createdAt, updatedAt)
  },
  async down(): Promise<void> {
    // Production: DROP TABLE contacts
  },
};
EOF_BACKEND_IA
```

![alt text](imagenes/create-contacts-table.migration.png)

### 8.9 — features/shipping/contacts/infrastructure/persistence/seeders/contacts.seeder.ts

Seeder de datos iniciales. Depende de que ya existan empresas (fase 7).

**Archivo:** `src/features/shipping/contacts/infrastructure/persistence/seeders/contacts.seeder.ts`

```bash
mkdir -p src/features/shipping/contacts/infrastructure/persistence/seeders
cat > src/features/shipping/contacts/infrastructure/persistence/seeders/contacts.seeder.ts <<'EOF_BACKEND_IA'
import { ContactModel } from '../models/contact.model.js';
import { CompanyModel } from '../../../../companies/infrastructure/persistence/models/company.model.js';

export async function seedContacts(): Promise<void> {
  const count = await ContactModel.count();
  if (count > 0) {
    return;
  }

  const companies = await CompanyModel.findAll({
    limit: 2,
    order: [['id', 'ASC']],
  });

  if (companies.length === 0) {
    return;
  }

  const records = [
    {
      companyId: companies[0].id,
      name: 'Laura Gómez',
      position: 'Gerente de Logística',
      phone: '+57 301 2223344',
      email: 'laura.gomez@example.com',
      isPrimary: true,
      isActive: true,
    },
  ];

  if (companies[1]) {
    records.push({
      companyId: companies[1].id,
      name: 'Carlos Ruiz',
      position: 'Coordinador de Compras',
      phone: '+57 315 5556677',
      email: 'carlos.ruiz@example.com',
      isPrimary: true,
      isActive: true,
    });
  }

  await ContactModel.bulkCreate(records);
}
EOF_BACKEND_IA
```

![alt text](imagenes/contacts.seeder.png)

### 8.10 — features/shipping/contacts/application/dto/contact-filter.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger. Incluye filtro por `companyId`.

**Archivo:** `src/features/shipping/contacts/application/dto/contact-filter.dto.ts`

```bash
mkdir -p src/features/shipping/contacts/application/dto
cat > src/features/shipping/contacts/application/dto/contact-filter.dto.ts <<'EOF_BACKEND_IA'
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class ContactFilterDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number;

  @ApiPropertyOptional({ example: 'laura' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  companyId?: number;
}
EOF_BACKEND_IA
```

![alt text](imagenes/contact-filter.dto.png)

### 8.11 — features/shipping/contacts/application/dto/contact-response.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/shipping/contacts/application/dto/contact-response.dto.ts`

```bash
mkdir -p src/features/shipping/contacts/application/dto
cat > src/features/shipping/contacts/application/dto/contact-response.dto.ts <<'EOF_BACKEND_IA'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContactResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  companyId: number;

  @ApiProperty({ example: 'Laura Gómez' })
  name: string;

  @ApiPropertyOptional({ example: 'Gerente de Logística' })
  position?: string;

  @ApiPropertyOptional({ example: '+57 301 2223344' })
  phone?: string;

  @ApiPropertyOptional({ example: 'laura.gomez@example.com' })
  email?: string;

  @ApiProperty({ example: true })
  isPrimary: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
EOF_BACKEND_IA
```

![alt text](imagenes/ontact-response.dto.png)

### 8.12 — features/shipping/contacts/application/dto/create-contact.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/shipping/contacts/application/dto/create-contact.dto.ts`

```bash
mkdir -p src/features/shipping/contacts/application/dto
cat > src/features/shipping/contacts/application/dto/create-contact.dto.ts <<'EOF_BACKEND_IA'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  companyId: number;

  @ApiProperty({ example: 'Laura Gómez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'Gerente de Logística' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional({ example: '+57 301 2223344' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'laura.gomez@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
EOF_BACKEND_IA
```

![alt text](imagenes/create-contact.dto.png)

### 8.13 — features/shipping/contacts/application/dto/update-contact.dto.ts

DTO de actualización. `companyId` se excluye a propósito: un contacto no cambia de empresa.

**Archivo:** `src/features/shipping/contacts/application/dto/update-contact.dto.ts`

```bash
mkdir -p src/features/shipping/contacts/application/dto
cat > src/features/shipping/contacts/application/dto/update-contact.dto.ts <<'EOF_BACKEND_IA'
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateContactDto } from './create-contact.dto.js';

export class UpdateContactDto extends PartialType(
  OmitType(CreateContactDto, ['companyId'] as const),
) {}
EOF_BACKEND_IA
```

![alt text](imagenes/update-contact.dto.png)

### 8.14 — features/shipping/contacts/application/mappers/contact.mapper.ts

Mapper entre entidad de dominio y DTO de respuesta.

**Archivo:** `src/features/shipping/contacts/application/mappers/contact.mapper.ts`

```bash
mkdir -p src/features/shipping/contacts/application/mappers
cat > src/features/shipping/contacts/application/mappers/contact.mapper.ts <<'EOF_BACKEND_IA'
import { Contact } from '../../domain/entities/contact.entity.js';
import { ContactResponseDto } from '../dto/contact-response.dto.js';
import { ContactModel } from '../../infrastructure/persistence/models/contact.model.js';

export class ContactMapper {
  static toDomain(model: ContactModel): Contact {
    return Contact.reconstitute({
      id: model.id,
      companyId: model.companyId,
      name: model.name,
      position: model.position ?? undefined,
      phone: model.phone ?? undefined,
      email: model.email ?? undefined,
      isPrimary: model.isPrimary,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toResponse(entity: Contact): ContactResponseDto {
    return {
      id: entity.id!,
      companyId: entity.companyId,
      name: entity.name,
      position: entity.position,
      phone: entity.phone,
      email: entity.email,
      isPrimary: entity.isPrimary,
      isActive: entity.isActive,
      createdAt: entity.createdAt!,
      updatedAt: entity.updatedAt!,
    };
  }

  static toPersistence(entity: Contact): Partial<ContactModel> {
    return {
      id: entity.id,
      companyId: entity.companyId,
      name: entity.name,
      position: entity.position ?? null,
      phone: entity.phone ?? null,
      email: entity.email ?? null,
      isPrimary: entity.isPrimary ?? false,
      isActive: entity.isActive ?? true,
    };
  }
}
EOF_BACKEND_IA
```

![alt text](imagenes/contact.mapper.png)

### 8.15 — features/shipping/contacts/application/use-cases/create-contact.use-case.ts

Caso de uso. Verifica que la empresa exista (cruce con el feature `companies`) y aplica la regla de contacto principal único.

**Archivo:** `src/features/shipping/contacts/application/use-cases/create-contact.use-case.ts`

```bash
mkdir -p src/features/shipping/contacts/application/use-cases
cat > src/features/shipping/contacts/application/use-cases/create-contact.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { CompanyNotFoundException } from '../../../companies/domain/exceptions/company-not-found.exception.js';
import {
  COMPANY_REPOSITORY,
  type ICompanyRepository,
} from '../../../companies/domain/interfaces/company-repository.interface.js';
import { Contact } from '../../domain/entities/contact.entity.js';
import {
  CONTACT_REPOSITORY,
  type IContactRepository,
} from '../../domain/interfaces/contact-repository.interface.js';
import { CreateContactDto } from '../dto/create-contact.dto.js';
import { ContactMapper } from '../mappers/contact.mapper.js';

@Injectable()
export class CreateContactUseCase {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepository: IContactRepository,
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: ICompanyRepository,
  ) {}

  async execute(dto: CreateContactDto) {
    const company = await this.companyRepository.findById(dto.companyId);
    if (!company) {
      throw new CompanyNotFoundException(dto.companyId);
    }

    const contact = Contact.create({
      companyId: dto.companyId,
      name: dto.name,
      position: dto.position,
      phone: dto.phone,
      email: dto.email,
      isPrimary: dto.isPrimary,
    });

    if (contact.isPrimary) {
      await this.contactRepository.clearPrimaryFlag(dto.companyId);
    }

    const created = await this.contactRepository.create(contact);
    return ContactMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

![alt text](imagenes/create-contact.use-case.png)

### 8.16 — features/shipping/contacts/application/use-cases/delete-contact.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/shipping/contacts/application/use-cases/delete-contact.use-case.ts`

```bash
mkdir -p src/features/shipping/contacts/application/use-cases
cat > src/features/shipping/contacts/application/use-cases/delete-contact.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ContactNotFoundException } from '../../domain/exceptions/contact-not-found.exception.js';
import {
  CONTACT_REPOSITORY,
  type IContactRepository,
} from '../../domain/interfaces/contact-repository.interface.js';

@Injectable()
export class DeleteContactUseCase {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepository: IContactRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const contact = await this.contactRepository.findById(id);
    if (!contact) {
      throw new ContactNotFoundException(id);
    }

    await this.contactRepository.delete(id);
  }
}
EOF_BACKEND_IA
```

![alt text](imagenes/delete-contact.use-case.png)

### 8.17 — features/shipping/contacts/application/use-cases/get-contact.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/shipping/contacts/application/use-cases/get-contact.use-case.ts`

```bash
mkdir -p src/features/shipping/contacts/application/use-cases
cat > src/features/shipping/contacts/application/use-cases/get-contact.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ContactNotFoundException } from '../../domain/exceptions/contact-not-found.exception.js';
import {
  CONTACT_REPOSITORY,
  type IContactRepository,
} from '../../domain/interfaces/contact-repository.interface.js';
import { ContactMapper } from '../mappers/contact.mapper.js';

@Injectable()
export class GetContactUseCase {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepository: IContactRepository,
  ) {}

  async execute(id: number) {
    const contact = await this.contactRepository.findById(id);
    if (!contact) {
      throw new ContactNotFoundException(id);
    }

    return ContactMapper.toResponse(contact);
  }
}
EOF_BACKEND_IA
```

![alt text](imagenes/get-contact.use-case.png)

### 8.18 — features/shipping/contacts/application/use-cases/list-contacts.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/shipping/contacts/application/use-cases/list-contacts.use-case.ts`

```bash
mkdir -p src/features/shipping/contacts/application/use-cases
cat > src/features/shipping/contacts/application/use-cases/list-contacts.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import {
  CONTACT_REPOSITORY,
  type IContactRepository,
} from '../../domain/interfaces/contact-repository.interface.js';
import { ContactFilterDto } from '../dto/contact-filter.dto.js';
import { ContactMapper } from '../mappers/contact.mapper.js';

@Injectable()
export class ListContactsUseCase {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepository: IContactRepository,
  ) {}

  async execute(filter: ContactFilterDto) {
    const result = await this.contactRepository.findAll(filter);
    return {
      items: result.items.map((contact) => ContactMapper.toResponse(contact)),
      meta: result.meta,
    };
  }
}
EOF_BACKEND_IA
```

![alt text](imagenes/list-contacts.use-case.png)

### 8.19 — features/shipping/contacts/application/use-cases/update-contact.use-case.ts

Caso de uso (aplicación). También aplica la regla de contacto principal único al actualizar.

**Archivo:** `src/features/shipping/contacts/application/use-cases/update-contact.use-case.ts`

```bash
mkdir -p src/features/shipping/contacts/application/use-cases
cat > src/features/shipping/contacts/application/use-cases/update-contact.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ContactNotFoundException } from '../../domain/exceptions/contact-not-found.exception.js';
import {
  CONTACT_REPOSITORY,
  type IContactRepository,
} from '../../domain/interfaces/contact-repository.interface.js';
import { UpdateContactDto } from '../dto/update-contact.dto.js';
import { ContactMapper } from '../mappers/contact.mapper.js';

@Injectable()
export class UpdateContactUseCase {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepository: IContactRepository,
  ) {}

  async execute(id: number, dto: UpdateContactDto) {
    const contact = await this.contactRepository.findById(id);
    if (!contact) {
      throw new ContactNotFoundException(id);
    }

    contact.update(dto);

    if (dto.isPrimary === true) {
      await this.contactRepository.clearPrimaryFlag(contact.companyId, contact.id);
    }

    const updated = await this.contactRepository.update(contact);
    return ContactMapper.toResponse(updated);
  }
}
EOF_BACKEND_IA
```

![alt text](imagenes/update-contact.use-case.png)

### 8.20 — features/shipping/contacts/presentation/http/serializers/contact.serializer.ts

Serializer de presentación (forma estable de la respuesta HTTP).

**Archivo:** `src/features/shipping/contacts/presentation/http/serializers/contact.serializer.ts`

```bash
mkdir -p src/features/shipping/contacts/presentation/http/serializers
cat > src/features/shipping/contacts/presentation/http/serializers/contact.serializer.ts <<'EOF_BACKEND_IA'
import { Contact } from '../../../domain/entities/contact.entity.js';
import { ContactResponseDto } from '../../../application/dto/contact-response.dto.js';
import { ContactMapper } from '../../../application/mappers/contact.mapper.js';

export class ContactSerializer {
  static serialize(entity: Contact): ContactResponseDto {
    return ContactMapper.toResponse(entity);
  }
}
EOF_BACKEND_IA
```

![alt text](imagenes/contact.serializer.png)

### 8.21 — features/shipping/contacts/presentation/http/controllers/contacts.controller.ts

Controller delgado: valida DTO, llama use-case, devuelve respuesta.

**Archivo:** `src/features/shipping/contacts/presentation/http/controllers/contacts.controller.ts`

```bash
mkdir -p src/features/shipping/contacts/presentation/http/controllers
cat > src/features/shipping/contacts/presentation/http/controllers/contacts.controller.ts <<'EOF_BACKEND_IA'
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
import { CreateContactDto } from '../../../application/dto/create-contact.dto.js';
import { UpdateContactDto } from '../../../application/dto/update-contact.dto.js';
import { ContactFilterDto } from '../../../application/dto/contact-filter.dto.js';
import { ContactResponseDto } from '../../../application/dto/contact-response.dto.js';
import { CreateContactUseCase } from '../../../application/use-cases/create-contact.use-case.js';
import { UpdateContactUseCase } from '../../../application/use-cases/update-contact.use-case.js';
import { DeleteContactUseCase } from '../../../application/use-cases/delete-contact.use-case.js';
import { GetContactUseCase } from '../../../application/use-cases/get-contact.use-case.js';
import { ListContactsUseCase } from '../../../application/use-cases/list-contacts.use-case.js';

@ApiTags('Contacts')
@Controller('contacts')
export class ContactsController {
  constructor(
    private readonly createContactUseCase: CreateContactUseCase,
    private readonly updateContactUseCase: UpdateContactUseCase,
    private readonly deleteContactUseCase: DeleteContactUseCase,
    private readonly getContactUseCase: GetContactUseCase,
    private readonly listContactsUseCase: ListContactsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un contacto' })
  @ApiCreatedResponse({ type: ContactResponseDto })
  create(@Body() dto: CreateContactDto) {
    return this.createContactUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar contactos (opcionalmente por empresa)' })
  @ApiOkResponse({ type: [ContactResponseDto] })
  findAll(@Query() filter: ContactFilterDto) {
    return this.listContactsUseCase.execute(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un contacto por ID' })
  @ApiOkResponse({ type: ContactResponseDto })
  findOne(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.getContactUseCase.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un contacto' })
  @ApiOkResponse({ type: ContactResponseDto })
  update(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Body() dto: UpdateContactDto,
  ) {
    return this.updateContactUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un contacto' })
  @ApiNoContentResponse()
  remove(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.deleteContactUseCase.execute(id);
  }
}
EOF_BACKEND_IA
```

![alt text](imagenes/contacts.controller.png)

### 8.22 — features/shipping/contacts/index.ts

Barrel export del feature para imports limpios.

**Archivo:** `src/features/shipping/contacts/index.ts`

```bash
mkdir -p src/features/shipping/contacts
cat > src/features/shipping/contacts/index.ts <<'EOF_BACKEND_IA'
export { ContactsModule } from './contacts.module.js';
EOF_BACKEND_IA
```

![alt text](imagenes/contac_index.png)

### 8.23 — features/shipping/contacts/contacts.module.ts

Módulo Nest del feature. Importa `CompaniesModule` para poder inyectar `COMPANY_REPOSITORY` y validar la FK.

**Archivo:** `src/features/shipping/contacts/contacts.module.ts`

```bash
mkdir -p src/features/shipping/contacts
cat > src/features/shipping/contacts/contacts.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module.js';
import { CONTACT_REPOSITORY } from './domain/interfaces/contact-repository.interface.js';
import { ContactRepository } from './infrastructure/persistence/repositories/contact.repository.js';
import { CreateContactUseCase } from './application/use-cases/create-contact.use-case.js';
import { UpdateContactUseCase } from './application/use-cases/update-contact.use-case.js';
import { DeleteContactUseCase } from './application/use-cases/delete-contact.use-case.js';
import { GetContactUseCase } from './application/use-cases/get-contact.use-case.js';
import { ListContactsUseCase } from './application/use-cases/list-contacts.use-case.js';
import { ContactsController } from './presentation/http/controllers/contacts.controller.js';

@Module({
  imports: [CompaniesModule],
  controllers: [ContactsController],
  providers: [
    ContactRepository,
    { provide: CONTACT_REPOSITORY, useExisting: ContactRepository },
    CreateContactUseCase,
    UpdateContactUseCase,
    DeleteContactUseCase,
    GetContactUseCase,
    ListContactsUseCase,
  ],
  exports: [CONTACT_REPOSITORY],
})
export class ContactsModule {}
EOF_BACKEND_IA
```

![alt text](imagenes/contacts.module.png)

### 8.24 — Actualizar company.model.ts (cerrar la asociación)

Vuelve al modelo de Empresa (fase 7) y agrega `@HasMany(() => ContactModel)` con import estático.

**Archivo:** `src/features/shipping/companies/infrastructure/persistence/models/company.model.ts`

```bash
mkdir -p src/features/shipping/companies/infrastructure/persistence/models
cat > src/features/shipping/companies/infrastructure/persistence/models/company.model.ts <<'EOF_BACKEND_IA'
import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { ContactModel } from '../../../../contacts/infrastructure/persistence/models/contact.model.js';

@Table({ tableName: 'companies' })
export class CompanyModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING(20), allowNull: false, unique: true })
  declare nit: string;

  @Column({ type: DataType.STRING(200), allowNull: false })
  declare razonSocial: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isActive: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @HasMany(() => ContactModel)
  declare contacts: ContactModel[];

  // addresses, shipments, invoices se agregan en sus respectivas fases.
}
EOF_BACKEND_IA
```

![alt text](imagenes/company.model_contact.png)

### 8.25 — Actualizar sequelize.factory.ts (registrar ContactModel)

Registra en ALL_MODELS solo los modelos ya creados (orden de dependencias).

**Archivo:** `src/infrastructure/database/sequelize/sequelize.factory.ts`

```bash
mkdir -p src/infrastructure/database/sequelize
cat > src/infrastructure/database/sequelize/sequelize.factory.ts <<'EOF_BACKEND_IA'
import { Sequelize } from 'sequelize-typescript';
import { DatabaseDialect } from '../../../config/environment/env.interface.js';
import { getSequelizeOptions } from './sequelize.options.js';

import { CompanyModel } from '../../../features/shipping/companies/infrastructure/persistence/models/company.model.js';
import { ContactModel } from '../../../features/shipping/contacts/infrastructure/persistence/models/contact.model.js';

export const ALL_MODELS = [
  CompanyModel,
  ContactModel,
];

async function loadDialectModule(moduleName: string): Promise<any> {
  // Proyecto ESM: require() no existe como global, se usa import() dinámico.
  const mod: any = await import(moduleName);
  return mod.default ?? mod;
}

export async function createSequelizeInstance(
  dialect: DatabaseDialect,
): Promise<Sequelize> {
  const options = getSequelizeOptions(dialect);

  let dialectModule: any;

  switch (dialect) {
    case DatabaseDialect.MySQL:
      dialectModule = await loadDialectModule('mysql2');
      break;
    case DatabaseDialect.Postgres:
      dialectModule = await loadDialectModule('pg');
      break;
    case DatabaseDialect.MSSQL:
      dialectModule = await loadDialectModule('tedious');
      break;
    case DatabaseDialect.Oracle:
      dialectModule = await loadDialectModule('oracledb');
      break;
    default:
      throw new Error(`Dialecto no soportado: ${dialect}`);
  }

  const sequelize = new Sequelize({
    ...options,
    dialectModule,
    models: ALL_MODELS,
  } as any);

  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión exitosa a ${dialect.toUpperCase()}`);
  } catch (error: any) {
    console.error(
      `❌ Error conectando a ${dialect.toUpperCase()}:`,
      error.message,
    );
    throw error;
  }

  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: false });
    console.log('✅ Tablas sincronizadas');
  }

  return sequelize;
}
EOF_BACKEND_IA
```

![alt text](imagenes/sequelize.factory_contact.png)

### 8.26 — Actualizar shipping.module.ts

Agrega el feature module de negocio recién terminado.

**Archivo:** `src/features/shipping/shipping.module.ts`

```bash
mkdir -p src/features/shipping
cat > src/features/shipping/shipping.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { CompaniesModule } from './companies/companies.module.js';
import { ContactsModule } from './contacts/contacts.module.js';

@Module({
  imports: [CompaniesModule, ContactsModule],
  exports: [CompaniesModule, ContactsModule],
})
export class ShippingModule {}
EOF_BACKEND_IA
```

![alt text](imagenes/shipping.module_contact.png)

### 8.27 — Actualizar database-seeder.service.ts

Ejecuta seeders en orden de dependencias: primero empresas, luego contactos.

**Archivo:** `src/infrastructure/database/seeders/database-seeder.service.ts`

```bash
mkdir -p src/infrastructure/database/seeders
cat > src/infrastructure/database/seeders/database-seeder.service.ts <<'EOF_BACKEND_IA'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { seedCompanies } from '../../../features/shipping/companies/infrastructure/persistence/seeders/companies.seeder.js';
import { seedContacts } from '../../../features/shipping/contacts/infrastructure/persistence/seeders/contacts.seeder.js';

/**
 * Ejecuta seeders en orden de dependencias.
 * Solo en entornos no productivos.
 */
@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    try {
      await seedCompanies();
      await seedContacts();
      this.logger.log('✅ Seeders ejecutados');
    } catch (error: any) {
      this.logger.error(`❌ Error en seeders: ${error.message}`, error.stack);
      throw error;
    }
  }
}
EOF_BACKEND_IA
```

![alt text](imagenes/database-seeder.service.png)

### 8.28 — Verificar tabla física `contacts` y API

`app.module.ts` **no necesita cambios**: ya importa `ShippingModule`, que ahora expone tanto `CompaniesModule` como `ContactsModule`.

Arranca la app. Debe crear/sync tabla `contacts` (con FK a `companies`), correr seeder y exponer `/api/contacts`. Prueba list/create en Swagger o curl, y confirma que `GET /api/contacts?companyId=1` filtra correctamente.

```bash
npm run start:dev
```

**Consola**

![alt text](imagenes/contact_consola.png)

**/api/contacts**

![alt text](imagenes/api_contacts.png)

---------------------------------------------------------------