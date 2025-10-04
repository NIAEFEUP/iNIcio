import CandidateCurriculum from "@/components/candidate/candidate-curriculum";
import CandidateAnswers from "@/components/candidate/page/candidate-answers";
import CandidateComments from "@/components/candidate/page/candidate-comments";
import CandidateQuickInfo from "@/components/candidate/page/candidate-quick-info";
import CommentFrame from "@/components/comments/comment-frame";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { submitApplicationComment } from "@/lib/application";
import { auth } from "@/lib/auth";
import { getCandidateWithMetadata } from "@/lib/candidate";
import { getApplicationComments } from "@/lib/comment";

import { getRecruiters, isRecruiter } from "@/lib/recruiter";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

type CandidatePageProps = {
  params: any;
};

export default async function CandidatePage({ params }: CandidatePageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!(await isRecruiter(session?.user.id))) redirect("/");

  const { id } = await params;

  const candidate = await getCandidateWithMetadata(id);
  const comments = await getApplicationComments(id);

  const recruiters = await getRecruiters();

  const saveToDatabase = async (content: Array<any>) => {
    "use server";

    return await submitApplicationComment(id, content, session?.user.id);
  };

  return (
    <div className="h-screen mx-4 md:mx-16">
      <section className="flex flex-col md:flex-row gap-4 h-full">
        <div>
          <CandidateQuickInfo candidate={candidate} />
        </div>

        <Tabs defaultValue="answers" className="w-full h-3/4">
          <TabsList className="w-full">
            <TabsTrigger value="answers">Respostas</TabsTrigger>
            {candidate.application.curriculum && (
              <TabsTrigger value="curriculum">Currículo</TabsTrigger>
            )}
            <TabsTrigger value="comments">
              Comentários ({comments.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="answers" className="w-full">
            <CandidateAnswers
              key={crypto.randomUUID()}
              application={candidate.application}
            />
          </TabsContent>
          {candidate.application.curriculum && (
            <TabsContent value="curriculum">
              <CandidateCurriculum application={candidate.application} />
            </TabsContent>
          )}
          <TabsContent value="comments">
            <CommentFrame>
              <CandidateComments
                comments={comments}
                saveToDatabase={saveToDatabase}
                recruiters={recruiters}
              />
            </CommentFrame>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
