import { redirect } from "next/navigation";

export default function ForgotPasswordPage() {
  redirect("/auth?error=password_reset_disabled");
}
