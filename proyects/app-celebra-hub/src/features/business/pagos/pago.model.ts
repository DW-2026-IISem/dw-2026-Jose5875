import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface PagoI {
  id?: number;
  referencia_tipo: string;
  referencia_id: number;
  metodo: string;
  monto: number;
  fecha: Date;
  estado: string;
  created_at?: Date;
  updated_at?: Date;
}

export class Pago extends Model<PagoI> implements PagoI {
  public id!: number;
  public referencia_tipo!: string;
  public referencia_id!: number;
  public metodo!: string;
  public monto!: number;
  public fecha!: Date;
  public estado!: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Pago.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    referencia_tipo: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    referencia_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    metodo: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    monto: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },

    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    estado: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Pago",
    tableName: "pagos",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
