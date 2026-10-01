import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { PageShell } from "@/components/ui";
import { signInAction } from "@/lib/actions";

export default function SignInPage() {
  return (
    <PageShell title="Sign in" eyebrow="Authentication">
      <div className="card mx-auto max-w-lg p-6">
        <ActionForm action={signInAction} submitLabel="Sign in">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-[#34124d]">Email</span>
            <input className="input" name="email" type="email" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-[#34124d]">Password</span>
            <input className="input" name="password" type="password" required />
          </label>
        </ActionForm>
        <Link className="mt-5 inline-block text-sm font-semibold text-[#34124d] underline" href="/auth/forgot-password">
          Forgot password?
        </Link>
      </div>
    </PageShell>
  );
}
