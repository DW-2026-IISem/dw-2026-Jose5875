import {
  DataTypes,
  Model
} from "sequelize";

import { sequelize } from "../../../database/db";

export interface ClienteI {
  id?: number;
  tipo_documento: string;
  numero_documento: string;
  nombre: string;
  telefono: string;
  email: string;
  is_active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Cliente extends Model<ClienteI> {
  public id!: number;

  public tipo_documento!: string;

  public numero_documento!: string;

  public nombre!: string;

  public telefono!: string;

  public email!: string;

  public is_active!: boolean;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

Cliente.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    tipo_documento: {
      type: DataTypes.STRING(20),
      allowNull: false
    },

    numero_documento: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },

    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false
    },

    telefono: {
      type: DataTypes.STRING(30),
      allowNull: false
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        isEmail: {
          msg: "El email debe tener un formato válido"
        }
      }
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: "Cliente",
    tableName: "clientes",
    timestamps: true
  }
);
