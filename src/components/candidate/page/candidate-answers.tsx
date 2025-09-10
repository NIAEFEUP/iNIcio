import { User } from "@/lib/db";

export interface CandidateAnswersProps {
  candidate: User;
}

export default function CandidateAnswers({ candidate }: CandidateAnswersProps) {
  return <div>Candidate Answers</div>;
}
