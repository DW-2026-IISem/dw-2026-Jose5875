import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface EventoServicioI {
  id?: number;
  referencia_id: number;
  tipo: string;
  fecha: Date;
  cantidad: number;
  observaciones?: string | null;
  estado: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class EventoServicio
  extends Model<EventoServicioI>
  implements EventoServicioI {

  public id!: number;

  public referencia_id!: number;

  public tipo!: string;

  public fecha!: Date;

  public cantidad!: number;

  public observaciones!: string | null;

  public estado!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

EventoServicio.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    referencia_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    tipo: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    fecha: {
      type: DataTypes.DATE,
      allowNull: false
    },

    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },

    observaciones: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    estado: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "pendiente"
    }
  },
  {
    sequelize,
    modelName: "EventoServicio",
    tableName: "evento_servicios",
    timestamps: true
  }
);
