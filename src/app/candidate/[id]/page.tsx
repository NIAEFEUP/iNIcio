import CandidateAnswers from "@/components/candidate/page/candidate-answers";
import CandidateComments from "@/components/candidate/page/candidate-comments";
import CandidateQuickInfo from "@/components/candidate/page/candidate-quick-info";
import { getApplicationComments } from "@/lib/comment";

import { getUser } from "@/lib/db";

type CandidatePageProps = {
  params: {
    id: string;
  };
};

export default async function CandidatePage({ params }: CandidatePageProps) {
  const { id } = await params;

  const candidate = await getUser(id);
  const comments = await getApplicationComments(id);

  return (
    <div className="flex flex-col gap-8 mx-32">
      <section>
        <h2 className="text-2xl font-bold">Comentários</h2>
        <CandidateComments comments={comments} candidate={candidate} />
      </section>

      <section className="flex flex-row">
        <CandidateQuickInfo candidate={candidate} />
        <CandidateAnswers candidate={candidate} />
      </section>
    </div>
  );
}
