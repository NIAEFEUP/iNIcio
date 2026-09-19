import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import CandidateComments from "@/components/candidate/page/candidate-comments";
import CommentFrame from "@/components/comments/comment-frame";
import DynamicCandidatesCard from "@/components/dynamic/dynamic-candidates-card";
import { RealTimeEditor } from "@/components/editor/real-time-editor-dynamic-import";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import {
  EvaluationLayout,
  EvaluationPanel,
} from "@/components/layout/evaluation-layout";
import { EvaluationTabs } from "@/components/layout/evaluation-tabs";
import RecruiterAssignedInfo from "@/components/recruiter/recruiter-assigned-info";

import { candidate } from "@/db/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createDynamicComment,
  getDynamic,
  getDynamicInterviewers,
  updateDynamic,
} from "@/lib/dynamic";
import { getDynamicComments } from "@/lib/comment";
import { generateJWT } from "@/lib/jwt";
import { getRecruiters, isRecruiter } from "@/lib/recruiter";
import { getRole } from "@/lib/role";
import { getTargetRecruitment } from "@/lib/selected-recruitment";
import { requireRecruiterSession } from "@/lib/action-guard";

export default async function DynamicPage({ params }: any) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const targetRecruitment = await getTargetRecruitment();
  const recruitmentId = targetRecruitment?.id;
  if (!recruitmentId) notFound();

  if (!(await isRecruiter(session?.user.id, recruitmentId))) redirect("/");

  async function handleContentSave(content: any) {
    "use server";
    await requireRecruiterSession(recruitmentId);
    await updateDynamic(id, content);
  }

  async function handleCommentSave(content: Array<any>) {
    "use server";
    const user = await requireRecruiterSession(recruitmentId);
    await createDynamicComment(id, content, user.id);
    return true;
  }

  async function addDynamicClassification(
    candidateId: string,
    classification: string,
  ) {
    "use server";
    await requireRecruiterSession(recruitmentId);

    await db
      .update(candidate)
      .set({ dynamicClassification: classification })
      .where(
        and(
          eq(candidate.userId, candidateId),
          eq(candidate.recruitmentId, recruitmentId),
        ),
      );
  }

  const dynamic = await getDynamic(id, recruitmentId);
  if (!dynamic) notFound();

  const recruiters = await getRecruiters(recruitmentId);
  const interviewers = await getDynamicInterviewers(dynamic.id);
  const comments = await getDynamicComments(dynamic.id);

  const jwt = await generateJWT(
    session?.user.id,
    await getRole(session?.user.id),
  );

  return (
    <EvaluationLayout
      header={
        <PageHeader
          backHref="/candidates"
          title={
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Dinâmica
              </h1>
              <Badge variant="secondary">
                {dynamic.candidates.length}{" "}
                {dynamic.candidates.length === 1 ? "candidato" : "candidatos"}
              </Badge>
            </div>
          }
        />
      }
      sidebar={
        <>
          <DynamicCandidatesCard
            candidates={dynamic.candidates}
            addDynamicClassification={addDynamicClassification}
          />

          <RecruiterAssignedInfo
            interviewers={interviewers}
            title="Recrutadores"
          />
        </>
      }
    >
      <EvaluationTabs
        defaultValue="dynamic"
        tabs={[
          {
            id: "dynamic",
            label: "Dinâmica",
            content: (
              <EvaluationPanel>
                <RealTimeEditor
                  token={jwt}
                  key={`dynamic-editor-${id}`}
                  roomId={`dynamic-${id}`}
                  docId={`dynamic-${id}`}
                  userName={session ? session.user.name : "Anonymous"}
                  saveHandler={handleContentSave}
                  entity={dynamic}
                  mentionItems={recruiters}
                  saveHandlerTimeout={250}
                />
              </EvaluationPanel>
            ),
          },
          {
            id: "comments",
            label: "Comentários",
            count: comments.length,
            content: (
              <CommentFrame>
                <CandidateComments
                  candidate={dynamic.candidates}
                  type="dynamic"
                  comments={comments}
                  saveToDatabase={handleCommentSave}
                  recruiters={recruiters}
                />
              </CommentFrame>
            ),
          },
        ]}
      />
    </EvaluationLayout>
  );
}
