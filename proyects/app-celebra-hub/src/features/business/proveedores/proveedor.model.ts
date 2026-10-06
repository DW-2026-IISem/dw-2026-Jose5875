import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface ProveedorI {
  id?: number;
  nit: string;
  razon_social: string;
  contacto: string;
  telefono: string;
  email: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class Proveedor
  extends Model<ProveedorI>
  implements ProveedorI {

  public id!: number;
  public nit!: string;
  public razon_social!: string;
  public contacto!: string;
  public telefono!: string;
  public email!: string;
  public is_active!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Proveedor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    nit: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },

    razon_social: {
      type: DataTypes.STRING(150),
      allowNull: false
    },

    contacto: {
      type: DataTypes.STRING(150),
      allowNull: false
    },

    telefono: {
      type: DataTypes.STRING(30),
      allowNull: false
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: "Proveedor",
    tableName: "proveedores",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);
