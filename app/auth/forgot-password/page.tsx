import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { PageShell } from "@/components/ui";
import { forgotPasswordAction } from "@/lib/actions";

export default function ForgotPasswordPage() {
  return (
    <PageShell title="Forgot password" eyebrow="Authentication">
      <div className="card mx-auto max-w-lg p-6">
        <ActionForm action={forgotPasswordAction} submitLabel="Send reset link">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-[#34124d]">Email</span>
            <input className="input" name="email" type="email" required />
          </label>
        </ActionForm>
        <Link className="mt-5 inline-block text-sm font-semibold text-[#34124d] underline" href="/auth/sign-in">
          Back to sign in
        </Link>
      </div>
    </PageShell>
  );
}
