/*
  Warnings:

  - You are about to drop the column `provisionPercentage` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `selfCostFactor` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `xledgerId` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "EmployeeDetails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "xledgerId" TEXT,
    "provisionPercentage" REAL DEFAULT 0.0,
    "selfCostFactor" REAL DEFAULT 1.5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "roleId" TEXT NOT NULL,
    "employeeDetailsId" TEXT,
    CONSTRAINT "User_employeeDetailsId_fkey" FOREIGN KEY ("employeeDetailsId") REFERENCES "EmployeeDetails" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "roleId", "updatedAt") SELECT "createdAt", "email", "id", "roleId", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeDetails_xledgerId_key" ON "EmployeeDetails"("xledgerId");
