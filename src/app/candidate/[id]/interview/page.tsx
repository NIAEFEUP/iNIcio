"use server";

import { RealTimeEditor } from "@/components/editor/real-time-editor-dynamic-import";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import CandidateQuickInfo from "@/components/candidate/page/candidate-quick-info";
import { Separator } from "@/components/ui/separator";
import CandidateComments from "@/components/candidate/page/candidate-comments";
import { db, getUser } from "@/lib/db";
import { getApplication, getApplicationInterests } from "@/lib/application";
import { getInterview, updateInterview } from "@/lib/interview";
import { eq } from "drizzle-orm";
import { interview } from "@/db/schema";

export default async function InterviewPage({ params }: any) {
  const { id } = await params;

  async function handleSave(content: any) {
    "use server";

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    await updateInterview(id, content);

    return true;
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const candidate = await getUser(session ? session.user.id : "");
  const application = await getApplication(candidate?.id);
  const applicationInterests = await getApplicationInterests(application);
  const comments = [];

  const interview = await getInterview(id);

  return (
    <>
      <div className="flex flex-col gap-16 mx-32">
        <section className="flex flex-col gap-4">
          <Separator />
          <h2 className="text-2xl font-bold">Comentários</h2>
          <CandidateComments comments={comments} candidate={candidate} />
        </section>

        <section className="flex flex-row my-0">
          <CandidateQuickInfo
            candidate={candidate}
            application={application}
            applicationInterests={applicationInterests}
          />
          <RealTimeEditor
            roomId={`interview-${id}`}
            websocketUrl="ws://0.0.0.0:1234"
            userName={session ? session.user.name : ""}
            interview={interview}
            saveHandler={handleSave}
          />
        </section>
      </div>
    </>
  );
}
