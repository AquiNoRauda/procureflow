import { Hono } from "hono";
import { prisma } from "../prisma";
import type { Variables } from "../index";
import { randomUUID } from "crypto";

const app = new Hono<{ Variables: Variables }>();

async function getValidOrder(orderId: string | undefined, userId: string) {
  if (!orderId) return null;
  return prisma.order.findFirst({ where: { id: orderId, userId } });
}

// GET /api/purchases — list purchase items for a specific order
app.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  const orderId = c.req.query("orderId");
  if (!orderId) return c.json({ data: [] });
  const order = await getValidOrder(orderId, user.id);
  if (!order) return c.json({ data: [] });
  const items = await prisma.purchaseItem.findMany({
    where: { userId: user.id, orderId },
    orderBy: { createdAt: "asc" },
  });
  return c.json({ data: items });
});

// POST /api/purchases — add or merge a purchase item within an order
app.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const body = await c.req.json<{ name: string; supplier: string; quantity: number; unit: string; orderId: string }>();
  if (!body.orderId) return c.json({ error: { message: "orderId required", code: "VALIDATION" } }, 400);
  const order = await getValidOrder(body.orderId, user.id);
  if (!order) return c.json({ error: { message: "Order not found", code: "NOT_FOUND" } }, 404);

  const existing = await prisma.purchaseItem.findFirst({
    where: { userId: user.id, orderId: body.orderId, name: body.name, supplier: body.supplier },
  });

  if (existing) {
    const updated = await prisma.purchaseItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + body.quantity },
    });
    return c.json({ data: updated });
  }

  const item = await prisma.purchaseItem.create({
    data: {
      id: randomUUID(),
      name: body.name,
      supplier: body.supplier,
      quantity: body.quantity,
      unit: body.unit,
      userId: user.id,
      orderId: body.orderId,
    },
  });
  return c.json({ data: item }, 201);
});

// PATCH /api/purchases/:id — update quantity
app.patch("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const { quantity } = await c.req.json<{ quantity: number }>();
  const { id } = c.req.param();

  if (quantity <= 0) {
    await prisma.purchaseItem.deleteMany({ where: { id, userId: user.id } });
    return new Response(null, { status: 204 });
  }

  const item = await prisma.purchaseItem.updateMany({
    where: { id, userId: user.id },
    data: { quantity },
  });

  if (item.count === 0) return c.json({ error: { message: "Not found", code: "NOT_FOUND" } }, 404);
  return c.json({ data: { id, quantity } });
});

// DELETE /api/purchases/:id — delete a single item
app.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  await prisma.purchaseItem.deleteMany({ where: { id: c.req.param("id"), userId: user.id } });
  return new Response(null, { status: 204 });
});

// DELETE /api/purchases — clear all items for an order
app.delete("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  const orderId = c.req.query("orderId");
  if (!orderId) return new Response(null, { status: 204 });
  await prisma.purchaseItem.deleteMany({ where: { userId: user.id, orderId } });
  return new Response(null, { status: 204 });
});

// DELETE /api/purchases/supplier/:name — clear by supplier within an order
app.delete("/supplier/:name", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  const orderId = c.req.query("orderId");
  if (!orderId) return new Response(null, { status: 204 });
  await prisma.purchaseItem.deleteMany({
    where: { userId: user.id, orderId, supplier: decodeURIComponent(c.req.param("name")) },
  });
  return new Response(null, { status: 204 });
});

export const purchaseRouter = app;
