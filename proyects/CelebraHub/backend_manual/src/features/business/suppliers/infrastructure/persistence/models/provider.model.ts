import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({ tableName: 'providers' })
export class ProviderModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING(20), allowNull: false, unique: true })
  declare nit: string;

  @Column({ type: DataType.STRING(200), allowNull: false })
  declare razonSocial: string;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare contacto: string;

  @Column({ type: DataType.STRING(20), allowNull: false })
  declare telefono: string;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare email: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isActive: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Asociación (eventoServicio) se agrega en la fase donde se
  // construya el feature de events/servicios, con import estático normal.
}
