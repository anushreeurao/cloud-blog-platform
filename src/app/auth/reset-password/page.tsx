import { redirect } from "next/navigation";

export default function ResetPasswordPage() {
  redirect("/auth?error=password_reset_disabled");
}
