import CandidateAnswers from "@/components/candidate/page/candidate-answers";
import CandidateComments from "@/components/candidate/page/candidate-comments";
import CandidateQuickInfo from "@/components/candidate/page/candidate-quick-info";
import { Separator } from "@/components/ui/separator";
import { getApplication, getApplicationInterests } from "@/lib/application";
import { auth } from "@/lib/auth";
import { getApplicationComments } from "@/lib/comment";

import { getUser } from "@/lib/db";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

type CandidatePageProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
};

export default async function CandidatePage({ params }: CandidatePageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user.role !== "recruiter") redirect("/");

  const { id } = await params;

  const candidate = await getUser(id);
  const application = await getApplication(id);
  const applicationInterests = await getApplicationInterests(application);
  const comments = await getApplicationComments(id);

  return (
    <div className="flex flex-col gap-16 mx-32">
      <section className="flex flex-row">
        <CandidateQuickInfo
          candidate={candidate}
          application={application}
          applicationInterests={applicationInterests}
        />
        <CandidateAnswers key={crypto.randomUUID()} application={application} />
      </section>

      <section className="flex flex-col gap-4">
        <Separator />
        <h2 className="text-2xl font-bold">Comentários</h2>
        <CandidateComments comments={comments} candidate={candidate} />
      </section>
    </div>
  );
}
