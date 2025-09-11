import CandidateAnswers from "@/components/candidate/page/candidate-answers";
import CandidateComments from "@/components/candidate/page/candidate-comments";
import CandidateQuickInfo from "@/components/candidate/page/candidate-quick-info";
import { getApplicationComments } from "@/lib/comment";

import { getUser } from "@/lib/db";

type CandidatePageProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
};

export default async function CandidatePage({ params }: CandidatePageProps) {
  const { id } = await params;

  const candidate = await getUser(id);
  const comments = await getApplicationComments(id);

  const answers = [
    {
      title: "Primeiro título",
      content: "Primeiro conteúdo",
    },
  ];

  return (
    <div className="flex flex-col gap-8 mx-32">
      <section>
        <h2 className="text-2xl font-bold">Comentários</h2>
        <CandidateComments comments={comments} candidate={candidate} />
      </section>

      <section className="flex flex-row">
        <CandidateQuickInfo candidate={candidate} />
        {answers.map((answer) => (
          <CandidateAnswers key={crypto.randomUUID()} answer={answer} />
        ))}
      </section>
    </div>
  );
}
