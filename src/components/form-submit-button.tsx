"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import {
  finishNavigationProgress,
  startNavigationProgress,
} from "@/components/navigation-progress";

export function FormSubmitButton({
  className,
  icon,
  label,
  pendingLabel,
}: {
  className: string;
  icon?: ReactNode;
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);

  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      startNavigationProgress();
      return;
    }
    if (wasPending.current) {
      wasPending.current = false;
      const timer = window.setTimeout(finishNavigationProgress, 0);
      return () => window.clearTimeout(timer);
    }
  }, [pending]);

  useEffect(
    () => () => {
      if (wasPending.current) finishNavigationProgress();
    },
    [],
  );

  return (
    <button
      aria-busy={pending}
      className={className}
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="button-spinner" size={16} />
      ) : (
        icon
      )}
      {pending ? pendingLabel : label}
    </button>
  );
}
