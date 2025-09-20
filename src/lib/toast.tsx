"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "error";

type ToastMessage = {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  notify: (message: Omit<ToastMessage, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const notify = useCallback((message: Omit<ToastMessage, "id">) => {
    setMessages((prev) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      return [...prev, { ...message, id }];
    });
  }, []);

  const remove = useCallback((id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
        {messages.map((message) => (
          <ToastCard key={message.id} onClose={() => remove(message.id)} {...message} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

type ToastCardProps = ToastMessage & {
  onClose: () => void;
};

function ToastCard({ title, description, variant = "default", onClose }: ToastCardProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur",
        variant === "success" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
        variant === "error" && "border-destructive/40 bg-destructive/10 text-destructive"
      )}
    >
      {variant === "success" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
      ) : variant === "error" ? (
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
      ) : null}
      <div className="flex-1 text-sm">
        <p className="font-medium">{title}</p>
        {description ? <p className="mt-0.5 text-xs opacity-80">{description}</p> : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        Close
      </button>
    </div>
  );
}
