import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface ContratoI {
  id?: number;
  cliente_id: number;
  numero: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  valor: number;
  estado: string;
  created_at?: Date;
  updated_at?: Date;
}

export class Contrato
  extends Model<ContratoI>
  implements ContratoI {

  public id!: number;
  public cliente_id!: number;
  public numero!: string;
  public fecha_inicio!: Date;
  public fecha_fin!: Date;
  public valor!: number;
  public estado!: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Contrato.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    numero: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },

    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: false
    },

    fecha_fin: {
      type: DataTypes.DATE,
      allowNull: false
    },

    valor: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },

    estado: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: "Contrato",
    tableName: "contratos",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);
