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
} from "@/lib/interview";

import EditorFrame from "@/components/editor/editor-frame";
import CommentFrame from "@/components/comments/comment-frame";
import { getRecruiters, isRecruiter } from "@/lib/recruiter";
import { redirect } from "next/navigation";
import { getCandidateWithMetadata } from "@/lib/candidate";
import CandidateComments from "@/components/candidate/page/candidate-comments";
import { CandidateClassificationComponent } from "@/components/candidate/classification";
import { getClassifications } from "@/lib/classification";

export default async function InterviewPage({ params }: any) {
  const { id } = await params;

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

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const candidate = await getCandidateWithMetadata(id);

  const interview = await getInterview(id);

  const recruiters = await getRecruiters();

  const comments = await getInterviewComments(interview.id);

  const classifications = await getClassifications();

  return (
    <>
      <div className="min-h-screen bg-background p-6">
        <div className="mx-16 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
            <div className="space-y-6 lg:col-span-2">
              <CandidateQuickInfo candidate={candidate} />

              <CommentFrame>
                <CandidateComments
                  candidate={candidate}
                  type="interview"
                  comments={comments}
                  saveToDatabase={handleCommentSave}
                />
              </CommentFrame>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-4 w-full">
              <div className="w-full">
                <CandidateClassificationComponent
                  classifications={classifications}
                />
              </div>

              <EditorFrame>
                <RealTimeEditor
                  roomId={`interview-${id}`}
                  userName={session ? session.user.name : ""}
                  saveHandler={handleContentSave}
                  entity={interview}
                  mentionItems={recruiters}
                />
              </EditorFrame>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
