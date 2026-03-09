import { Hono } from "hono";
import { prisma } from "../prisma";
import type { Variables } from "../index";
import { randomUUID } from "crypto";

export const ordersRouter = new Hono<{ Variables: Variables }>();

// GET /api/orders — list all orders for user
ordersRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { items: true } } },
  });

  return c.json({ data: orders });
});

// POST /api/orders — create new draft order
ordersRouter.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const body = await c.req.json<{ name: string }>();
  if (!body.name?.trim()) return c.json({ error: { message: "Name required", code: "VALIDATION" } }, 400);

  const order = await prisma.order.create({
    data: { id: randomUUID(), name: body.name.trim(), status: "draft", userId: user.id },
    include: { _count: { select: { items: true } } },
  });

  return c.json({ data: order }, 201);
});

// PATCH /api/orders/:id — update name or complete
ordersRouter.patch("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const order = await prisma.order.findFirst({ where: { id: c.req.param("id"), userId: user.id } });
  if (!order) return c.json({ error: { message: "Not found", code: "NOT_FOUND" } }, 404);

  const body = await c.req.json<{ name?: string; status?: string }>();
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      ...(body.name ? { name: body.name.trim() } : {}),
      ...(body.status === "completed" ? { status: "completed", completedAt: new Date() } : {}),
    },
    include: { _count: { select: { items: true } } },
  });

  return c.json({ data: updated });
});

// DELETE /api/orders/:id — delete draft order (cascade items)
ordersRouter.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const order = await prisma.order.findFirst({ where: { id: c.req.param("id"), userId: user.id } });
  if (!order) return c.json({ error: { message: "Not found", code: "NOT_FOUND" } }, 404);

  await prisma.order.delete({ where: { id: order.id } });
  return new Response(null, { status: 204 });
});

// GET /api/orders/:id/items — get items for a specific order
ordersRouter.get("/:id/items", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  const order = await prisma.order.findFirst({ where: { id: c.req.param("id"), userId: user.id } });
  if (!order) return c.json({ error: { message: "Not found", code: "NOT_FOUND" } }, 404);

  const items = await prisma.purchaseItem.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: "asc" },
  });

  return c.json({ data: items });
});
