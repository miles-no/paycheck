import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export enum Role {
  admin = "admin",
  manager = "manager",
  employee = "employee",
}
async function seed() {
  //todo: cleanup the existing database
  // await prisma.user.delete({ where: { email } }).catch(() => {
  // no worries if it doesn't exist yet
  // });

  const [adminRole, managerRole, employee] = await Promise.all([
    prisma.role.create({
      data: {
        name: Role.admin,
      },
    }),
    prisma.role.create({
      data: {
        name: Role.manager,
      },
    }),
    prisma.role.create({
      data: {
        name: Role.employee,
      },
    }),
  ]);

  await prisma.user.create({
    data: {
      email: "henry.sjoen@miles.no",
      googleId: "105452855211059551858",
      name: "Henry Sjøen",
      picture:
        "https://lh3.googleusercontent.com/a/AGNmyxYXhcU8d2Pnux3C5vymoXib2Vzhe4BfV365WEfz=s96-c",
      role: {
        connect: {
          id: adminRole.id,
        },
      },
    },
  });

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
