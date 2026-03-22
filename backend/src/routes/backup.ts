import { Hono } from "hono";
import { prisma } from "../prisma";
import type { Variables } from "../index";
import { randomUUID } from "crypto";

export const backupRouter = new Hono<{ Variables: Variables }>();

// GET /api/backup — export all user data as JSON
backupRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const [orders, purchaseItems, catalogSuppliers, catalogItems] = await Promise.all([
    prisma.order.findMany({ where: { userId: user.id } }),
    prisma.purchaseItem.findMany({ where: { userId: user.id } }),
    prisma.catalogSupplier.findMany({ where: { userId: user.id } }),
    prisma.catalogItem.findMany({ where: { userId: user.id } }),
  ]);

  return c.json({
    data: {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      orders,
      purchaseItems,
      catalogSuppliers,
      catalogItems,
    },
  });
});

type OrderInput = {
  id: string;
  name: string;
  customer?: string | null;
  status: string;
  createdAt: string | Date;
  completedAt?: string | Date | null;
};

type PurchaseItemInput = {
  id: string;
  name: string;
  supplier: string;
  quantity: number;
  unit: string;
  createdAt: string | Date;
  orderId: string;
};

type CatalogSupplierInput = {
  id: string;
  name: string;
  color: string;
};

type CatalogItemInput = {
  id: string;
  name: string;
  supplierId: string;
  supplierName: string;
  unit: string;
  category: string;
};

type BackupPayload = {
  version?: string;
  orders?: OrderInput[];
  purchaseItems?: PurchaseItemInput[];
  catalogSuppliers?: CatalogSupplierInput[];
  catalogItems?: CatalogItemInput[];
};

// POST /api/backup/restore — restore user data from JSON
backupRouter.post("/restore", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const body = await c.req.json<BackupPayload>();

  const orders: OrderInput[] = body.orders ?? [];
  const purchaseItems: PurchaseItemInput[] = body.purchaseItems ?? [];
  const catalogSuppliers: CatalogSupplierInput[] = body.catalogSuppliers ?? [];
  const catalogItems: CatalogItemInput[] = body.catalogItems ?? [];

  // Delete all existing user data
  // CatalogItems must be deleted before CatalogSuppliers due to FK constraint
  // Orders cascade to PurchaseItems
  await prisma.$transaction([
    prisma.catalogItem.deleteMany({ where: { userId: user.id } }),
    prisma.catalogSupplier.deleteMany({ where: { userId: user.id } }),
    prisma.order.deleteMany({ where: { userId: user.id } }),
    prisma.purchaseItem.deleteMany({ where: { userId: user.id } }),
  ]);

  // Recreate everything from backup
  await prisma.$transaction([
    prisma.order.createMany({
      data: orders.map((o) => ({
        id: o.id ?? randomUUID(),
        name: o.name,
        customer: o.customer ?? null,
        status: o.status,
        createdAt: new Date(o.createdAt),
        completedAt: o.completedAt ? new Date(o.completedAt) : null,
        userId: user.id,
      })),
    }),
    prisma.purchaseItem.createMany({
      data: purchaseItems.map((p) => ({
        id: p.id ?? randomUUID(),
        name: p.name,
        supplier: p.supplier,
        quantity: p.quantity,
        unit: p.unit,
        createdAt: new Date(p.createdAt),
        orderId: p.orderId,
        userId: user.id,
      })),
    }),
    prisma.catalogSupplier.createMany({
      data: catalogSuppliers.map((s) => ({
        id: s.id ?? randomUUID(),
        name: s.name,
        color: s.color,
        userId: user.id,
      })),
    }),
    prisma.catalogItem.createMany({
      data: catalogItems.map((i) => ({
        id: i.id ?? randomUUID(),
        name: i.name,
        supplierId: i.supplierId,
        supplierName: i.supplierName,
        unit: i.unit,
        category: i.category,
        userId: user.id,
      })),
    }),
  ]);

  return c.json({ data: { success: true, restoredAt: new Date().toISOString() } });
});
