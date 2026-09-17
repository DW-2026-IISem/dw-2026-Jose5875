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

@Table({ tableName: 'clients' })
export class ClientModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING(15), allowNull: false })
  declare tipoDocumento: string;

  @Column({ type: DataType.STRING(20), allowNull: false, unique: true })
  declare numeroDocumento: string;

  @Column({ type: DataType.STRING(200), allowNull: false })
  declare nombre: string;

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

  // bookings se agrega en la fase de Reserva (sección 4.24).
}
