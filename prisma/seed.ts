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

  const employeeDetails = await prisma.employeeDetails.create({
    data: {
      xledgerId: "26839556",
    },
  });

  // Add Henry
  await prisma.user.create({
    data: {
      email: "henry@miles.no",
      password: {
        create: {
          hash: await bcrypt.hash("henrypassword", 10),
        },
      },
      roleId: employee.id,
      employeeDetailsId: employeeDetails.id,
    },
  });

  // Admin user
  await prisma.user.create({
    data: {
      email: "admin@miles.no",
      password: {
        create: {
          hash: await bcrypt.hash("adminpassword", 10),
        },
      },
      roleId: adminRole.id,
    },
  });

  // Manager user
  await prisma.user.create({
    data: {
      email: "manager@miles.no",
      password: {
        create: {
          hash: await bcrypt.hash("managerpassword", 10),
        },
      },
      roleId: managerRole.id,
    },
  });

  // Employee user
  await prisma.user.create({
    data: {
      email: "employee@miles.no",
      password: {
        create: {
          hash: await bcrypt.hash("employeepassword", 10),
        },
      },
      roleId: employee.id,
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
