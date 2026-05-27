import { redirect } from "next/navigation";

export default function LegacyResetPasswordPage() {
  redirect("/auth?error=password_reset_disabled");
}
