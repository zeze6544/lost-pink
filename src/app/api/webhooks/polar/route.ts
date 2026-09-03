import { Webhooks } from "@polar-sh/nextjs";
import { markKept } from "@/lib/pages";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? "dev-secret",
  onOrderPaid: async (payload) => {
    const pageId = payload.data.metadata?.page_id;
    if (typeof pageId !== "string" || !pageId) return;
    await markKept(pageId, payload.data.id);
  },
  onCheckoutUpdated: async (payload) => {
    if (payload.data.status !== "succeeded") return;
    const pageId = payload.data.metadata?.page_id;
    if (typeof pageId !== "string" || !pageId) return;
    await markKept(pageId, payload.data.id);
  },
});
