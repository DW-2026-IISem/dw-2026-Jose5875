import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";
import { hashPassword } from "../../../shared/auth/password";

export interface UserI {
  id?: number;
  usuario: string;
  email: string;
  password: string;
  avatar?: string | null;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Model {
  public id!: number;
  public usuario!: string;
  public email!: string;
  public password!: string;
  public avatar!: string | null;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    usuario: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: "uq_users_usuario",
      validate: {
        notEmpty: { msg: "Usuario cannot be empty" },
        len: { args: [3, 80], msg: "Usuario must be between 3 and 80 characters" },
      },
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: "uq_users_email",
      validate: {
        isEmail: { msg: "Email must be a valid email address" },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Password cannot be empty" },
      },
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          user.password = await hashPassword(user.password);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed("password") && user.password) {
          user.password = await hashPassword(user.password);
        }
      },
      beforeBulkCreate: async (users: User[]) => {
        for (const user of users) {
          if (user.password) {
            user.password = await hashPassword(user.password);
          }
        }
      },
      beforeValidate: (user: User) => {
        if (user.usuario) user.usuario = user.usuario.trim().toLowerCase();
        if (user.email) user.email = user.email.trim().toLowerCase();
      },
    },
  }
);
