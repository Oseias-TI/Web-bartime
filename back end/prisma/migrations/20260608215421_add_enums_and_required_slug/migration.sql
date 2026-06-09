/*
  Warnings:

  - The `status` column on the `appointments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `commissions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `subscriptionStatus` column on the `tenants` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[slug]` on the table `tenants` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `type` on the `appointment_reminders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `slug` to the `tenants` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'PAID', 'CANCELED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('EMAIL_24H', 'EMAIL_1H');

-- AlterTable
ALTER TABLE "appointment_reminders" DROP COLUMN "type",
ADD COLUMN     "type" "ReminderType" NOT NULL;

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "status",
ADD COLUMN     "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "commissions" DROP COLUMN "status",
ADD COLUMN     "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "slug" TEXT NOT NULL,
DROP COLUMN "subscriptionStatus",
ADD COLUMN     "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL';

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "appointment_reminders_appointmentId_type_key" ON "appointment_reminders"("appointmentId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
