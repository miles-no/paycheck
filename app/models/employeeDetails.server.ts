//Employee detail
import { prisma } from "~/db.server";

// // The EmployeeDetails model is used to store information about the employee that is not stored in the xledger database.
// model EmployeeDetails {
//   id String @id @default(cuid())
//
//   xledgerId           String? @unique // xledgerId is the databaseId of the user in xledger. Used for access control - so that only users with the correct xledgerId can access the data
//     provisionPercentage Float?  @default(0.0) // The percentage of the provision that the user gets, for the amount over the self-cost
//   selfCostFactor      Float?  @default(1.5) // The factor that is used to calculate the self-cost of a timesheet
//
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
//   User      User[]
// }

export function getEmployeeDetail() {
  return prisma.employeeDetails;
}

// Get all employeeDetails
export function getEmployeeDetails() {
  return prisma.employeeDetails.findMany();
}

// Set provisionPercentage
export function setProvisionPercentage(
  xledgerId: string,
  provisionPercentage: number
) {
  return prisma.employeeDetails.upsert({
    where: { xledgerId: xledgerId },
    create: {
      provisionPercentage,
      xledgerId,
    },
    update: {
      provisionPercentage,
    },
  });
}

// Set selfCostFactor
export function setSelfCostFactor(xledgerId: string, selfCostFactor: number) {
  return prisma.employeeDetails.upsert({
    where: { xledgerId: xledgerId },
    create: {
      selfCostFactor,
      xledgerId,
    },
    update: {
      selfCostFactor,
    },
  });
}

// Upset employeeDetails
export function upsertEmployeeDetails(data: {
  xledgerId: string;
  provisionPercentage: number;
  selfCostFactor: number;
}) {
  return prisma.employeeDetails.upsert({
    where: { xledgerId: data.xledgerId },
    create: {
      xledgerId: data.xledgerId,
      provisionPercentage: data.provisionPercentage,
      selfCostFactor: data.selfCostFactor,
    },
    update: {
      provisionPercentage: data.provisionPercentage,
      selfCostFactor: data.selfCostFactor,
    },
  });
}

// get employeeDetails by xledgerId
export function getEmployeeDetailsByXledgerId(xledgerId: string) {
  return prisma.employeeDetails.findUnique({
    where: { xledgerId },
  });
}

// Get employeeDetails by id
export function getEmployeeDetailsById(id: string) {
  return prisma.employeeDetails.findUnique({
    where: { id },
  });
}

// Create employeeDetails
export function createEmployeeDetails(data: any) {
  return prisma.employeeDetails.create({
    data,
  });
}

// Update employeeDetails
export function updateEmployeeDetails(id: string, data: any) {
  return prisma.employeeDetails.update({
    where: { id },
    data,
  });
}

// Delete employeeDetails
export function deleteEmployeeDetails(id: string) {
  return prisma.employeeDetails.delete({
    where: { id },
  });
}
