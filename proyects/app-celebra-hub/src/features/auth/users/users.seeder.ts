import { faker } from "@faker-js/faker";
import { User } from "./user.model";

export const SEED_USERS = [
  { username: "admin", email: "admin@celebrahub.local", password: "Admin123!" },
  { username: "comercial", email: "comercial@celebrahub.local", password: "Comercial123!" },
  { username: "operaciones", email: "operaciones@celebrahub.local", password: "Operaciones123!" },
  { username: "proveedor", email: "proveedor@celebrahub.local", password: "Proveedor123!" },
  { username: "cartera", email: "cartera@celebrahub.local", password: "Cartera123!" },
] as const;

export async function seedUsers(count: number): Promise<number> {
  if (count <= 0) {
    console.log("⏭️ users: count=0, se omite");
    return 0;
  }

  let created = 0;

  for (const item of SEED_USERS) {
    const [user, wasCreated] = await User.findOrCreate({
      where: { username: item.username },
      defaults: {
        username: item.username,
        email: item.email,
        password: item.password,
        avatar: null,
        status: "active",
      },
    });

    if (wasCreated) {
      created++;
    } else if (user.status !== "active") {
      await user.update({ status: "active" });
    }
  }

  const extras = Math.max(0, count - SEED_USERS.length);

  for (let i = 0; i < extras; i++) {
    const username = `user.${i}.${faker.string.alphanumeric(6)}`.toLowerCase();

    await User.create({
      username,
      email: `${username}@celebrahub.local`,
      password: "Password123!",
      avatar: null,
      status: "active",
    });

    created++;
  }

  console.log(`✅ users: insertados ${created} usuario(s) (${SEED_USERS.length} canónicos + ${extras} aleatorios)`);
  return created;
}
