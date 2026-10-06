import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface SalonI {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class Salon
  extends Model<SalonI>
  implements SalonI {

  public id!: number;

  public nombre!: string;

  public descripcion!: string | null;

  public is_active!: boolean;

  public readonly created_at!: Date;

  public readonly updated_at!: Date;
}

Salon.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false
    },

    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: "Salon",
    tableName: "salones",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);
