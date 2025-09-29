import ApplicationClient from "@/components/application/application-client";
import { auth } from "@/lib/auth";
import { getFilenameUrl } from "@/lib/file-upload";
import { headers } from "next/headers";

export default async function Application() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const savedPicture = await getFilenameUrl(session?.user.image);

  return <ApplicationClient savedPicture={savedPicture} />;
}
