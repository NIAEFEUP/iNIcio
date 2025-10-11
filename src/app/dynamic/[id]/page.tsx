import CandidateComments from "@/components/candidate/page/candidate-comments";
import CandidateQuickInfo from "@/components/candidate/page/candidate-quick-info";
import CommentFrame from "@/components/comments/comment-frame";
import EditorFrame from "@/components/editor/editor-frame";
import RealTimeEditor from "@/components/editor/real-time-editor";
import { auth } from "@/lib/auth";
import { CandidateWithMetadata } from "@/lib/candidate";
import {
  createDynamicComment,
  getDynamic,
  updateDynamic,
  getDynamicInterviewers,
} from "@/lib/dynamic";
import { getRecruiters, isRecruiter } from "@/lib/recruiter";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDynamicComments } from "@/lib/comment";
import RecruiterAssignedInfo from "@/components/recruiter/recruiter-assigned-info";
import { generateJWT } from "@/lib/jwt";
import { getRole } from "@/lib/role";

export default async function DynamicPage({ params }: any) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  async function handleContentSave(content: any) {
    "use server";

    if (!session || !(await isRecruiter(session.user.id))) redirect("/");

    await updateDynamic(id, content);
  }

  async function handleCommentSave(content: Array<any>) {
    "use server";

    if (!session || !(await isRecruiter(session.user.id))) redirect("/");

    await createDynamicComment(id, content, session?.user.id);

    return true;
  }

  const dynamic = await getDynamic(id);

  const recruiters = await getRecruiters();

  const interviewers = await getDynamicInterviewers(dynamic.id);

  const comments = await getDynamicComments(dynamic.id);

  const jwt = await generateJWT(
    session?.user.id,
    await getRole(session?.user.id),
  );

  return (
    <div className="mx-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 mx-16">
        {dynamic.candidates.map((candidate: CandidateWithMetadata) => (
          <CandidateQuickInfo
            key={candidate.id}
            candidate={candidate}
            hideDynamicButton={true}
          />
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1">
          <div className="flex flex-col gap-4">
            <RecruiterAssignedInfo interviewers={interviewers} />
            <CommentFrame>
              <>
                <CandidateComments
                  candidate={dynamic.candidates}
                  comments={comments}
                  saveToDatabase={handleCommentSave}
                  type="dynamic"
                />
              </>
            </CommentFrame>
          </div>
        </div>
        <div className="col-span-3">
          <EditorFrame>
            <RealTimeEditor
              token={jwt}
              roomId={`dynamic-${id}`}
              docId={`dynamic-${id}`}
              userName={session?.user.name}
              saveHandler={handleContentSave}
              entity={dynamic}
              mentionItems={recruiters}
            />
          </EditorFrame>
        </div>
      </div>
    </div>
  );
}
