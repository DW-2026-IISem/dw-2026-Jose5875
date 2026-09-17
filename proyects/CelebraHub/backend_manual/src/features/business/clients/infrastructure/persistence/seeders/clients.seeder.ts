import { ClientModel } from '../models/client.model.js';

export async function seedClients(): Promise<void> {
  const count = await ClientModel.count();
  if (count > 0) {
    return;
  }

  await ClientModel.bulkCreate([
    {
      tipoDocumento: 'CC',
      numeroDocumento: '1121oi876543',
      nombre: 'María Fernanda Pérez',
      telefono: '3011234567',
      email: 'maria.perez@example.com',
      isActive: true,
    },
    {
      tipoDocumento: 'CC',
      numeroDocumento: '1121876544',
      nombre: 'Andrés Ipuana',
      telefono: '3007654321',
      email: 'andres.ipuana@example.com',
      isActive: true,
    },
  ]);
}
