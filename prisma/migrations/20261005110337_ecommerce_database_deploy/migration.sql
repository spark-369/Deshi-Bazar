/*
  Warnings:

  - You are about to drop the `Delivery` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `ChurnPrediction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CustomOrderStatus" AS ENUM ('PENDING', 'VERIFIED', 'CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustomItemStatus" AS ENUM ('REQUESTED', 'AVAILABLE', 'UNAVAILABLE', 'ADJUSTED');

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_orderId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "billingCountry" TEXT,
ADD COLUMN     "billingDistrict" TEXT,
ADD COLUMN     "billingDivision" TEXT,
ADD COLUMN     "billingPostalCode" TEXT,
ADD COLUMN     "distance" DOUBLE PRECISION,
ADD COLUMN     "shipCountry" TEXT,
ADD COLUMN     "shipDistrict" TEXT,
ADD COLUMN     "shipDivision" TEXT,
ADD COLUMN     "shipPostalCode" TEXT,
ADD COLUMN     "shippingMethod" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "customOrderId" TEXT,
ALTER COLUMN "currency" SET DEFAULT 'BDT';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "shippingCostPerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "sentiment" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "devices" JSONB,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpires" TIMESTAMP(3),
ADD COLUMN     "twoFactorCode" TEXT,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorExpires" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "district" TEXT,
ADD COLUMN     "division" TEXT,
ADD COLUMN     "postalCode" TEXT;

-- DropTable
DROP TABLE "Delivery";

-- CreateTable
CREATE TABLE "CustomOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "CustomOrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingMethod" TEXT,
    "distance" DOUBLE PRECISION,
    "shippingAddress" TEXT,
    "billingAddress" TEXT,
    "shipCountry" TEXT,
    "shipDivision" TEXT,
    "shipDistrict" TEXT,
    "shipPostalCode" TEXT,
    "billingCountry" TEXT,
    "billingDivision" TEXT,
    "billingDistrict" TEXT,
    "billingPostalCode" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomOrderItem" (
    "id" TEXT NOT NULL,
    "customOrderId" TEXT NOT NULL,
    "customItemName" TEXT NOT NULL,
    "productId" TEXT,
    "requestedQuantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "verifiedQuantity" DOUBLE PRECISION,
    "verifiedPrice" DOUBLE PRECISION,
    "itemTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "CustomItemStatus" NOT NULL DEFAULT 'REQUESTED',
    "sellerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomOrder_orderNumber_key" ON "CustomOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ChurnPrediction_userId_key" ON "ChurnPrediction"("userId");

-- AddForeignKey
ALTER TABLE "ProductRecommendation" ADD CONSTRAINT "ProductRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customOrderId_fkey" FOREIGN KEY ("customOrderId") REFERENCES "CustomOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomOrder" ADD CONSTRAINT "CustomOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomOrder" ADD CONSTRAINT "CustomOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomOrderItem" ADD CONSTRAINT "CustomOrderItem_customOrderId_fkey" FOREIGN KEY ("customOrderId") REFERENCES "CustomOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomOrderItem" ADD CONSTRAINT "CustomOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
