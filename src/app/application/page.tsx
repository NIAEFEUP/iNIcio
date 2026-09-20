import ApplicationClient from "@/components/application/application-client";
import SubmittedApplicationView from "@/components/application/submitted-application-view";
import { getApplication, getApplicationInterests } from "@/lib/application";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Application() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const existingApplication = await getApplication(session.user.id);

  if (existingApplication) {
    const interests = await getApplicationInterests(existingApplication);
    return (
      <SubmittedApplicationView
        application={existingApplication}
        interests={interests}
        user={{
          name: session.user.name,
          email: session.user.email,
        }}
      />
    );
  }

  return <ApplicationClient />;
}
