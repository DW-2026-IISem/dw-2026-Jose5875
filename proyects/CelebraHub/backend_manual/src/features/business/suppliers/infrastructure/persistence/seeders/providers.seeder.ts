import { ProviderModel } from '../models/provider.model.js';

export async function seedProviders(): Promise<void> {
  const count = await ProviderModel.count();
  if (count > 0) {
    return;
  }

  await ProviderModel.bulkCreate([
    {
      nit: '900123456-7',
      razonSocial: 'Decoraciones y Eventos del Caribe S.A.S.',
      contacto: 'Laura Gómez',
      telefono: '3001234567',
      email: 'contacto@decoracionescaribe.com',
      isActive: true,
    },
    {
      nit: '901987654-3',
      razonSocial: 'Catering Riohacha Ltda.',
      contacto: 'Carlos Pérez',
      telefono: '3009876543',
      email: 'ventas@cateringriohacha.com',
      isActive: true,
    },
  ]);
}
