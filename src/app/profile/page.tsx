import { redirect } from "next/navigation";

// Deprecated in favor of the AccountSettingsModal available via the profile dropdown
export default function ProfilePage() {
  redirect("/");
}
