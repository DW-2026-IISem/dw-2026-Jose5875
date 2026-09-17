import { VenueModel } from '../models/venue.model.js';

export async function seedVenues(): Promise<void> {
  const count = await VenueModel.count();
  if (count > 0) {
    return;
  }

  await VenueModel.bulkCreate([
    {
      nombre: 'Salón Caribe Grand',
      descripcion: 'Salón principal, capacidad 300 personas, con terraza al mar.',
      isActive: true,
    },
    {
      nombre: 'Salón Wayuu',
      descripcion: 'Salón mediano, capacidad 120 personas, ideal para eventos íntimos.',
      isActive: true,
    },
  ]);
}
