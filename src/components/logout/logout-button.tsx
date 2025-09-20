import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";

import { LogOut } from "lucide-react";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      <LogOut />
    </Button>
  );
}
