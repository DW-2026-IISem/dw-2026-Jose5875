import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface EventoI {
  id?: number;
  referencia_id: number;
  tipo: string;
  fecha: Date;
  cantidad: number;
  observaciones: string;
  estado: string;
}

export class Evento extends Model<EventoI> implements EventoI {
  public id!: number;
  public referencia_id!: number;
  public tipo!: string;
  public fecha!: Date;
  public cantidad!: number;
  public observaciones!: string;
  public estado!: string;
}

Evento.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    referencia_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    estado: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Evento",
    tableName: "eventos",
    timestamps: false,
  }
);
