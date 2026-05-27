"use client";

import { useMemo, useState } from "react";
import { AuthForm } from "@/components/auth-form";
import { Modal } from "@/components/ui/modal";
import type { AuthMode } from "@/lib/auth";
import { sanitizeInternalPath } from "@/lib/site-url";

type AuthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: AuthMode;
  nextPath?: string;
};

const modeTitles: Record<AuthMode, { title: string; description: string }> = {
  signin: {
    title: "Welcome to Inkflow",
    description: "Read, write, and publish with a clean Medium-inspired experience.",
  },
  signup: {
    title: "Create your Inkflow account",
    description: "Start publishing stories and build your audience.",
  },
};

export function AuthModal({ open, onOpenChange, initialMode = "signin", nextPath = "/dashboard" }: AuthModalProps) {
  const [draftMode, setDraftMode] = useState<AuthMode | null>(null);
  const safeNext = useMemo(() => sanitizeInternalPath(nextPath, "/dashboard"), [nextPath]);
  const mode = draftMode ?? initialMode;

  return (
    <Modal
      open={open}
      onClose={() => {
        setDraftMode(null);
        onOpenChange(false);
      }}
      title={modeTitles[mode].title}
      description={modeTitles[mode].description}
    >
      <AuthForm
        initialMode={mode}
        nextPath={safeNext}
        onModeChange={setDraftMode}
        onSuccess={() => {
          setDraftMode(null);
          onOpenChange(false);
        }}
      />
    </Modal>
  );
}
