import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface ReservaI {
  id?: number;
  cliente_id: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  estado: string;
  observaciones?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export class Reserva
  extends Model<ReservaI>
  implements ReservaI {

  public id!: number;
  public cliente_id!: number;
  public fecha_inicio!: Date;
  public fecha_fin!: Date;
  public estado!: string;
  public observaciones!: string | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Reserva.init(
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

    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: false
    },

    fecha_fin: {
      type: DataTypes.DATE,
      allowNull: false
    },

    estado: {
      type: DataTypes.STRING(50),
      allowNull: false
    },

    observaciones: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: "Reserva",
    tableName: "reservas",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);
