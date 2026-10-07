import { RoleUser } from "./role-user.model";
import { User } from "../users/user.model";
import { Role } from "../roles/role.model";

export async function seedRoleUsers(): Promise<void> {
  const adminUser = await User.findOne({ where: { username: "admin" } });
  const adminRole = await Role.findOne({ where: { name: "ADMIN" } });
  const comercialUser = await User.findOne({ where: { username: "comercial" } });
  const comercialRole = await Role.findOne({ where: { name: "COMERCIAL" } });

  if (!adminUser || !adminRole || !comercialUser || !comercialRole) {
    return;
  }

  const [adminAssignment] = await RoleUser.findOrCreate({
    where: { user_id: adminUser.id, role_id: adminRole.id },
    defaults: { status: "active" },
  });
  if (adminAssignment.status !== "active") {
    await adminAssignment.update({ status: "active" });
  }

  const [comercialAssignment] = await RoleUser.findOrCreate({
    where: { user_id: comercialUser.id, role_id: comercialRole.id },
    defaults: { status: "active" },
  });
  if (comercialAssignment.status !== "active") {
    await comercialAssignment.update({ status: "active" });
  }
}
