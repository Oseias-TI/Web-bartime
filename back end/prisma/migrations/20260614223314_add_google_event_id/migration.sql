-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "googleEventId" TEXT;

-- AlterTable
ALTER TABLE "business_hours" ADD COLUMN     "closeTime2" TEXT,
ADD COLUMN     "openTime2" TEXT;

-- CreateTable
CREATE TABLE "client_password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_password_reset_tokens_token_key" ON "client_password_reset_tokens"("token");

-- AddForeignKey
ALTER TABLE "client_password_reset_tokens" ADD CONSTRAINT "client_password_reset_tokens_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
