import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import {
  buildPaginatedResult,
  normalizePagination,
} from '../../../../../../common/utils/pagination.util.js';
import { Venue } from '../../../domain/entities/venue.entity.js';
import {
  VenueFindAllParams,
  IVenueRepository,
} from '../../../domain/interfaces/venue-repository.interface.js';
import { VenueMapper } from '../../../application/mappers/venue.mapper.js';
import { VenueModel } from '../models/venue.model.js';

@Injectable()
export class VenueRepository implements IVenueRepository {
  async create(venue: Venue): Promise<Venue> {
    const model = await VenueModel.create(VenueMapper.toPersistence(venue));
    return VenueMapper.toDomain(model);
  }

  async update(venue: Venue): Promise<Venue> {
    await VenueModel.update(VenueMapper.toPersistence(venue), {
      where: { id: venue.id },
    });
    const updated = await VenueModel.findByPk(venue.id!);
    return VenueMapper.toDomain(updated!);
  }

  async delete(id: number): Promise<void> {
    await VenueModel.destroy({ where: { id } });
  }

  async findById(id: number): Promise<Venue | null> {
    const model = await VenueModel.findByPk(id);
    return model ? VenueMapper.toDomain(model) : null;
  }

  async findAll(params: VenueFindAllParams) {
    const { page, limit, offset } = normalizePagination(
      params.page,
      params.limit,
    );

    const where = params.search
      ? { nombre: { [Op.like]: `%${params.search}%` } }
      : {};

    const { rows, count } = await VenueModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return buildPaginatedResult(
      rows.map((row) => VenueMapper.toDomain(row)),
      count,
      page,
      limit,
    );
  }
}
