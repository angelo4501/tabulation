"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui";
import { initialActionState } from "@/lib/action-state";

type ActionFormProps = {
  action: (state: typeof initialActionState, formData: FormData) => Promise<typeof initialActionState>;
  children: React.ReactNode;
  submitLabel: string;
};

export function ActionForm({ action, children, submitLabel }: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      {children}
      {state.message ? (
        <p className={state.ok ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-red-700"}>
          {state.message}
        </p>
      ) : null}
      <SubmitButton>{pending ? "Working..." : submitLabel}</SubmitButton>
    </form>
  );
}
