-- CreateEnum
CREATE TYPE "OrderStatusEnum" AS ENUM ('NEW', 'PROCESSING', 'ERROR', 'FINISHED');

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "processingStatus" "OrderStatusEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceivedOrder" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "company" TEXT,
    "zipCode" TEXT,
    "city" TEXT,
    "country" TEXT,
    "carrierKey" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentOrderId" INTEGER NOT NULL,

    CONSTRAINT "ReceivedOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceivedOrderDetail" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL,
    "eanCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedOrderId" INTEGER NOT NULL,

    CONSTRAINT "ReceivedOrderDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SentOrder" (
    "id" SERIAL NOT NULL,
    "OrderID" TEXT NOT NULL,
    "InvoiceSendLater" BOOLEAN NOT NULL DEFAULT false,
    "Issued" TEXT NOT NULL,
    "OrderType" TEXT NOT NULL DEFAULT 'standard',
    "Shipping" JSONB NOT NULL,
    "parentOrderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SentOrderProduct" (
    "id" SERIAL NOT NULL,
    "Barcode" TEXT NOT NULL,
    "OPTProductID" TEXT NOT NULL,
    "Qty" INTEGER NOT NULL,
    "Weight" INTEGER NOT NULL,
    "SentOrderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentOrderProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReceivedOrder_parentOrderId_key" ON "ReceivedOrder"("parentOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceivedOrderDetail_receivedOrderId_key" ON "ReceivedOrderDetail"("receivedOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "SentOrder_parentOrderId_key" ON "SentOrder"("parentOrderId");

-- AddForeignKey
ALTER TABLE "ReceivedOrder" ADD CONSTRAINT "ReceivedOrder_parentOrderId_fkey" FOREIGN KEY ("parentOrderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivedOrderDetail" ADD CONSTRAINT "ReceivedOrderDetail_receivedOrderId_fkey" FOREIGN KEY ("receivedOrderId") REFERENCES "ReceivedOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentOrder" ADD CONSTRAINT "SentOrder_parentOrderId_fkey" FOREIGN KEY ("parentOrderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentOrderProduct" ADD CONSTRAINT "SentOrderProduct_SentOrderId_fkey" FOREIGN KEY ("SentOrderId") REFERENCES "SentOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
