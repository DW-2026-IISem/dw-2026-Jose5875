export const createProvidersTableMigration = {
  name: 'create-providers-table',
  async up(): Promise<void> {
    // Sequelize sync handles table creation in development.
    // Production: CREATE TABLE providers (id, nit, razonSocial, contacto, telefono, email, isActive, createdAt, updatedAt)
  },
  async down(): Promise<void> {
    // Production: DROP TABLE providers
  },
};
