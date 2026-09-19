import EditorFrame from "@/components/editor/editor-frame";
import { RealTimeEditor } from "@/components/editor/real-time-editor-dynamic-import";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { generateJWT } from "@/lib/jwt";
import { getRole } from "@/lib/role";

export default async function Collab() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !(await isAdmin(session.user.id))) {
    redirect("/");
  }

  const jwt = await generateJWT(
    session.user.id,
    await getRole(session.user.id),
    ["collab-test"],
  );

  return (
    <EditorFrame>
      <RealTimeEditor
        token={jwt}
        roomId="collab-test"
        userName={session.user.name ?? ""}
      />
    </EditorFrame>
  );
}
