import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import {
  buildPaginatedResult,
  normalizePagination,
} from '../../../../../../common/utils/pagination.util.js';
import { Provider } from '../../../domain/entities/provider.entity.js';
import {
  ProviderFindAllParams,
  IProviderRepository,
} from '../../../domain/interfaces/provider-repository.interface.js';
import { ProviderMapper } from '../../../application/mappers/provider.mapper.js';
import { ProviderModel } from '../models/provider.model.js';

@Injectable()
export class ProviderRepository implements IProviderRepository {
  async create(provider: Provider): Promise<Provider> {
    const model = await ProviderModel.create(
      ProviderMapper.toPersistence(provider),
    );
    return ProviderMapper.toDomain(model);
  }

  async update(provider: Provider): Promise<Provider> {
    await ProviderModel.update(ProviderMapper.toPersistence(provider), {
      where: { id: provider.id },
    });
    const updated = await ProviderModel.findByPk(provider.id!);
    return ProviderMapper.toDomain(updated!);
  }

  async delete(id: number): Promise<void> {
    await ProviderModel.destroy({ where: { id } });
  }

  async findById(id: number): Promise<Provider | null> {
    const model = await ProviderModel.findByPk(id);
    return model ? ProviderMapper.toDomain(model) : null;
  }

  async findByNit(nit: string): Promise<Provider | null> {
    const model = await ProviderModel.findOne({ where: { nit } });
    return model ? ProviderMapper.toDomain(model) : null;
  }

  async findAll(params: ProviderFindAllParams) {
    const { page, limit, offset } = normalizePagination(
      params.page,
      params.limit,
    );

    const where = params.search
      ? {
          [Op.or]: [
            { razonSocial: { [Op.like]: `%${params.search}%` } },
            { nit: { [Op.like]: `%${params.search}%` } },
            { contacto: { [Op.like]: `%${params.search}%` } },
          ],
        }
      : {};

    const { rows, count } = await ProviderModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return buildPaginatedResult(
      rows.map((row) => ProviderMapper.toDomain(row)),
      count,
      page,
      limit,
    );
  }
}
