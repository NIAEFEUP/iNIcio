import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import CandidateCurriculum from "@/components/candidate/candidate-curriculum";
import { CandidateHeaderActions } from "@/components/candidate/candidate-header-actions";
import CandidateAnswers from "@/components/candidate/page/candidate-answers";
import CandidateComments from "@/components/candidate/page/candidate-comments";
import CandidateProfileCard from "@/components/candidate/page/candidate-profile-card";
import CandidateVotingStatus from "@/components/candidate/candidate-voting-status";
import CommentFrame from "@/components/comments/comment-frame";
import { RealTimeEditor } from "@/components/editor/real-time-editor-dynamic-import";
import { PageHeader } from "@/components/layout/page-header";
import {
  EvaluationLayout,
  EvaluationPanel,
} from "@/components/layout/evaluation-layout";
import { EvaluationTabs } from "@/components/layout/evaluation-tabs";
import RecruiterAssignedInfo from "@/components/recruiter/recruiter-assigned-info";

import { candidate } from "@/db/schema";
import { applicationAnswerCount } from "@/lib/candidate-answers";
import { auth } from "@/lib/auth";
import { getCandidateWithMetadata } from "@/lib/candidate";
import { db } from "@/lib/db";
import {
  addInterviewComment,
  getInterview,
  getInterviewComments,
  getInterviewers,
  updateInterview,
} from "@/lib/interview";
import { generateJWT } from "@/lib/jwt";
import { getRecruiters, isRecruiter } from "@/lib/recruiter";
import { getRole } from "@/lib/role";
import { getTargetRecruitment } from "@/lib/selected-recruitment";
import { requireRecruiterSession } from "@/lib/action-guard";

export default async function InterviewPage({ params }: any) {
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
    await updateInterview(id, content);
  }

  async function handleCommentSave(content: Array<any>) {
    "use server";
    const user = await requireRecruiterSession(recruitmentId);
    return await addInterviewComment(user.id, content, id);
  }

  async function addInterviewClassification(
    candidateId: string,
    classification: string,
  ) {
    "use server";
    await requireRecruiterSession(recruitmentId);

    if (!recruitmentId) return;

    await db
      .update(candidate)
      .set({ interviewClassification: classification })
      .where(
        and(
          eq(candidate.userId, candidateId),
          eq(candidate.recruitmentId, recruitmentId),
        ),
      );
  }

  const candidateWithMetadata = await getCandidateWithMetadata(
    id,
    recruitmentId,
  ).catch((err) => {
    console.error("Error fetching candidate interview metadata:", err);
    return undefined;
  });

  if (!candidateWithMetadata) notFound();

  const interview = await getInterview(id, recruitmentId);

  if (!interview) notFound();

  const recruiters = await getRecruiters(recruitmentId);
  const interviewers = await getInterviewers(interview.id);
  const comments = await getInterviewComments(interview.id);
  const answeredCount = applicationAnswerCount(
    candidateWithMetadata.application,
  );

  const jwt = await generateJWT(
    session?.user.id,
    await getRole(session?.user.id),
  );

  return (
    <EvaluationLayout
      header={
        <PageHeader
          backHref={`/candidate/${id}`}
          title={candidateWithMetadata.name}
          actions={
            <CandidateHeaderActions
              candidateId={candidateWithMetadata.id}
              currentPage="interview"
              dynamicId={candidateWithMetadata.dynamic?.dynamicId}
            />
          }
        />
      }
      sidebar={
        <>
          <CandidateProfileCard
            candidate={candidateWithMetadata}
            friends={candidateWithMetadata.knownRecruiters}
            authUser={
              session
                ? {
                    ...session.user,
                    image: session.user.image ?? "",
                    role: session.user.role as
                      "recruiter" | "candidate" | "admin",
                  }
                : null
            }
            classifyInterview={addInterviewClassification}
          />
          <RecruiterAssignedInfo interviewers={interviewers} />
          {candidateWithMetadata.votingDecision && (
            <CandidateVotingStatus
              votingDecision={candidateWithMetadata.votingDecision}
            />
          )}
        </>
      }
    >
      <EvaluationTabs
        defaultValue="interview"
        tabs={[
          {
            id: "interview",
            label: "Entrevista",
            content: (
              <EvaluationPanel>
                <RealTimeEditor
                  token={jwt}
                  key={`interview-editor-${id}`}
                  roomId={`interview-${id}`}
                  docId={`interview-${id}`}
                  userName={session ? session.user.name : "Anonymous"}
                  saveHandler={handleContentSave}
                  entity={interview}
                  mentionItems={recruiters}
                  saveHandlerTimeout={250}
                />
              </EvaluationPanel>
            ),
          },
          {
            id: "answers",
            label: "Respostas",
            count: answeredCount,
            content: (
              <CandidateAnswers
                key={candidateWithMetadata.id}
                application={candidateWithMetadata.application}
              />
            ),
          },
          {
            id: "curriculum",
            label: "Currículo",
            hidden: !candidateWithMetadata.application?.curriculum,
            content: (
              <EvaluationPanel>
                <CandidateCurriculum
                  application={candidateWithMetadata.application}
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
                  candidate={candidateWithMetadata}
                  type="interview"
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
