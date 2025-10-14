"use server";

import { RealTimeEditor } from "@/components/editor/real-time-editor-dynamic-import";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import CandidateQuickInfo from "@/components/candidate/page/candidate-quick-info";
import {
  addInterviewComment,
  getInterview,
  getInterviewComments,
  updateInterview,
  getInterviewers,
} from "@/lib/interview";

import EditorFrame from "@/components/editor/editor-frame";
import CommentFrame from "@/components/comments/comment-frame";
import { getRecruiters, isRecruiter } from "@/lib/recruiter";
import { redirect } from "next/navigation";
import { getCandidateWithMetadata } from "@/lib/candidate";
import CandidateComments from "@/components/candidate/page/candidate-comments";
import RecruiterAssignedInfo from "@/components/recruiter/recruiter-assigned-info";
import { generateJWT } from "@/lib/jwt";
import { getRole } from "@/lib/role";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { candidate } from "@/db/schema";

export default async function InterviewPage({ params }: any) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  async function handleContentSave(content: any) {
    "use server";

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!(await isRecruiter(session?.user.id))) redirect("/");

    await updateInterview(id, content);
  }

  async function handleCommentSave(content: Array<any>) {
    "use server";

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!isRecruiter(session?.user.id)) redirect("/");

    return await addInterviewComment(
      session ? session.user.id : "",
      content,
      id,
    );
  }

  async function addInterviewClassification(
    candidateId: string,
    classification: string,
  ) {
    "use server";

    if (!session || !(await isRecruiter(session.user.id))) redirect("/");

    await db
      .update(candidate)
      .set({ interviewClassification: classification })
      .where(eq(candidate.userId, candidateId));
  }

  const candidateWithMetadata = await getCandidateWithMetadata(id);

  const interview = await getInterview(id);

  const recruiters = await getRecruiters();

  const interviewers = await getInterviewers(interview.id);

  const comments = await getInterviewComments(interview.id);

  const jwt = await generateJWT(
    session?.user.id,
    await getRole(session?.user.id),
  );

  return (
    <>
      <div className="min-h-screen bg-background p-6">
        <div className="space-y-6 w-full max-w-[100em] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
            <div className="space-y-6 lg:col-span-2">
              <CandidateQuickInfo
                candidate={candidateWithMetadata}
                hideInterviewButton={true}
                showClassifyInterview={true}
                addInterviewClassification={addInterviewClassification}
              />
              <RecruiterAssignedInfo interviewers={interviewers} />

              <CommentFrame>
                <CandidateComments
                  candidate={candidateWithMetadata}
                  type="interview"
                  comments={comments}
                  saveToDatabase={handleCommentSave}
                />
              </CommentFrame>
            </div>

            <div className="lg:col-span-4">
              <EditorFrame>
                <RealTimeEditor
                  token={jwt}
                  key={`interview-editor-${id}`}
                  roomId={`interview-${id}`}
                  docId={`interview-${id}`}
                  userName={session ? session.user.name : "Anonymous"}
                  saveHandler={handleContentSave}
                  entity={interview}
                  mentionItems={recruiters}
                  saveHandlerTimeout={1000}
                />
              </EditorFrame>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
