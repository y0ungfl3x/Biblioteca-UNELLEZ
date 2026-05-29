import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
};

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@unellez.edu.ve";

  if (!publicKey || !privateKey) {
    throw new Error(
      "Faltan VAPID keys. Configura NEXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY.",
    );
  }

  return { publicKey, privateKey, subject };
}

function initWebPush() {
  const { publicKey, privateKey, subject } = getVapidConfig();
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  initWebPush();

  const admin = createAdminClient();
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("subscription, endpoint")
    .eq("user_id", userId);

  if (error || !subs) {
    return;
  }

  const message = JSON.stringify(payload);
  console.log(`[Push] Enviando notificacion a ${userId}:`, payload.title);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        const start = Date.now();
        await webpush.sendNotification(sub.subscription, message);
        console.log(
          `[Push] Enviado con exito a endpoint en ${Date.now() - start}ms`,
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
        }
      }
    }),
  );
}
