import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface CambioContratoI {
  id?: number;
  nombre: string;
  descripcion: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class CambioContrato
  extends Model<CambioContratoI>
  implements CambioContratoI
{
  public id!: number;
  public nombre!: string;
  public descripcion!: string;
  public is_active!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

CambioContrato.init(
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
    modelName: "CambioContrato",
    tableName: "cambios_contrato",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
