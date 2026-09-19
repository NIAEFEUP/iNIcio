import { EvaluationSkeleton } from "@/components/layout/evaluation-skeleton";

export default function Loading() {
  return <EvaluationSkeleton showInterviewers contentCardsCount={1} />;
}
