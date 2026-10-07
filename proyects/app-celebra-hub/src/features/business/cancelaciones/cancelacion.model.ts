import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface CancelacionI {
  id?: number;
  nombre: string;
  descripcion: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class Cancelacion
  extends Model<CancelacionI>
  implements CancelacionI
{
  public id!: number;
  public nombre!: string;
  public descripcion!: string;
  public is_active!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Cancelacion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Cancelacion",
    tableName: "cancelaciones",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
