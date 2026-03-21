import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";

const accountRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

accountRouter.delete("/delete", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  await prisma.user.delete({ where: { id: user.id } });

  return c.body(null, 204);
});

export { accountRouter };
