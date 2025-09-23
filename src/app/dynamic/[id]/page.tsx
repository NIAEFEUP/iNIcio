import CandidateComments from "@/components/candidate/page/candidate-comments";
import CandidateQuickInfo from "@/components/candidate/page/candidate-quick-info";
import CommentFrame from "@/components/comments/comment-frame";
import EditorFrame from "@/components/editor/editor-frame";
import RealTimeEditor from "@/components/editor/real-time-editor";
import { auth } from "@/lib/auth";
import { getDynamic, updateDynamic } from "@/lib/dynamic";
import { headers } from "next/headers";

export default async function DynamicPage({ params }: any) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  async function handleContentSave(content: any) {
    "use server";

    // CHANGE ROLE
    // if (session?.user.role !== "recruiter") redirect("/");

    await updateDynamic(id, content);

    return true;
  }

  async function handleCommentSave(content: string) {
    "use server";

    // CHANGE ROLE
    // if (session?.user.role !== "recruiter") redirect("/");

    // await createDynamicComment(id, content);

    return true;
  }

  const dynamic = await getDynamic(id);

  return (
    <div className="mx-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 mx-16">
        {dynamic.candidates.map((candidate) => (
          <CandidateQuickInfo
            key={candidate.candidateId}
            candidate={candidate.candidate.user}
            application={candidate.candidate.application}
            interests={candidate.candidate.application?.interests}
          />
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1">
          <CommentFrame>
            <CandidateComments
              comments={[]}
              saveToDatabase={handleCommentSave}
            />
          </CommentFrame>
        </div>
        <div className="col-span-3">
          <EditorFrame>
            <RealTimeEditor
              roomId={`dynamic-${id}`}
              websocketUrl={process.env.WEBSOCKET_URL!}
              userName={session?.user.name}
              saveHandler={handleContentSave}
              entity={dynamic}
            />
          </EditorFrame>
        </div>
      </div>
    </div>
  );
}
