/*
  Warnings:

  - The values [PAID] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PAID] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED');
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'VERIFIED', 'CONFIRMED', 'FAILED', 'REFUNDED');
ALTER TABLE "orders" ALTER COLUMN "payment_status" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "payment_status" TYPE "PaymentStatus_new" USING ("payment_status"::text::"PaymentStatus_new");
ALTER TABLE "payments" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "PaymentStatus_old";
ALTER TABLE "orders" ALTER COLUMN "payment_status" SET DEFAULT 'PENDING';
ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "coupon_code" TEXT,
ADD COLUMN     "courier_name" TEXT,
ADD COLUMN     "shipment_status" TEXT,
ADD COLUMN     "shiprocket_order_id" TEXT;
