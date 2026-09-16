import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database/db";
import bcrypt from 'bcryptjs';


export interface ClientI {
  id?: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  password: string;
  status: "ACTIVE" | "INACTIVE";
}

export class Client extends Model {
  public id!: number;
  public name!: string;
  public address!: string;
  public phone!: string;
  public email!: string;
  public password!: string;
  public status!: "ACTIVE" | "INACTIVE";
}

Client.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: { msg: "Phone cannot be empty" },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: { msg: "Email must be a valid email address" }, // Validate email format
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
      defaultValue: "ACTIVE",
    },
  },
  {
    sequelize,
    modelName: "Client",
    tableName: "clients",
    timestamps: false,
        hooks: {
          beforeCreate: async (client: Client) => {
            if (client.password) {
              const salt = await bcrypt.genSalt(10);
              client.password = await bcrypt.hash(client.password, salt);
            }
          },
          beforeUpdate: async (client: Client) => {
            if (client.password) {
              const salt = await bcrypt.genSalt(10);
              client.password = await bcrypt.hash(client.password, salt);
            }
          }
        }
  }
);