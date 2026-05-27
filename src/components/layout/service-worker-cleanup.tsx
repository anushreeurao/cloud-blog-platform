"use client";

import { useEffect } from "react";

export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister().catch(() => {
          // Ignore cleanup failures. This is a best-effort stabilization step.
        });
      });
    }).catch(() => {
      // Ignore environments where service worker APIs are restricted.
    });
  }, []);

  return null;
}
