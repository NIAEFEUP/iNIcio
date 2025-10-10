import {
  CandidateClassification,
  CandidateClassificationValue,
} from "@/lib/db";

export type CandidateClassificationWithValues = CandidateClassification & {
  classificationValues: Array<CandidateClassificationValue>;
};
