"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function PushNotifications() {
  const [mounted, setMounted] = useState(false);
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isWorking, setIsWorking] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Usar setTimeout para mover el setState fuera del ciclo de renderizado sincrónico
    setTimeout(() => {
      setMounted(true);
      const hasSupport =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window;
      setSupported(hasSupport);
      if (typeof window !== "undefined") {
        setPermission(Notification.permission);
      }
    }, 0);
  }, []);

  const publicKey = useMemo(
    () => process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
    [],
  );

  const registerAndSendSubscription = useCallback(async () => {
    if (!publicKey || typeof window === "undefined") return;

    try {
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register("/sw.js");
      }

      // Esperar a que el Service Worker esté activo
      if (!registration.active) {
        await new Promise<void>((resolve) => {
          const sw = registration!.installing || registration!.waiting;
          if (sw) {
            sw.addEventListener("statechange", (e) => {
              if ((e.target as ServiceWorker).state === "activated") resolve();
            });
          } else {
            // Si ya está activo por alguna razón
            resolve();
          }
          // Timeout de seguridad
          setTimeout(resolve, 2000);
        });
        // Refrescar registro tras espera
        registration = await navigator.serviceWorker.getRegistration();
      }

      if (!registration || !registration.active) {
        throw new Error("Service Worker no pudo activarse.");
      }

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (res.ok) {
        setIsSynced(true);
      }
    } catch (err) {
      console.error("Push sync error:", err);
    }
  }, [publicKey]);

  useEffect(() => {
    if (supported && permission === "granted" && !isSynced) {
      // Evitar setState sincrónico en useEffect
      const timer = setTimeout(() => {
        registerAndSendSubscription();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [supported, permission, isSynced, registerAndSendSubscription]);

  const enablePush = useCallback(async () => {
    setIsWorking(true);
    setError(null);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setError("Necesitas aceptar las notificaciones en el navegador.");
        return;
      }
      await registerAndSendSubscription();
    } catch {
      setError("No se pudo activar el push.");
    } finally {
      setIsWorking(false);
    }
  }, [registerAndSendSubscription]);

  if (!mounted || !supported) return null;

  if (permission === "granted" && isSynced) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Notificaciones push activas.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm">
      <div>
        <div className="font-semibold text-slate-900">
          Activa notificaciones push
        </div>
        <div className="text-slate-500">
          Recibe alertas de cambios de prestamos y recordatorios.
        </div>
        {error && <div className="text-rose-600 text-xs mt-1">{error}</div>}
      </div>
      <button
        type="button"
        onClick={enablePush}
        disabled={isWorking}
        className="px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-semibold disabled:opacity-60"
      >
        {isWorking ? "Activando..." : "Activar"}
      </button>
    </div>
  );
}
