import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

enum Role {
  admin = "admin",
  manager = "manager",
  employee = "employee",
}

async function seed() {
  console.log(`Creating roles... 🌱`);
  await Promise.all([
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
