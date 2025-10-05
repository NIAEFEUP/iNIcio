import { Comment } from "@/components/candidate/page/candidate-comments";
import {
  NewApplicationComment,
  NewDynamicComment,
  NewInterviewComment,
} from "./db";

export function createApplicationCommentFormat(
  content: Array<any>,
  authorId: string,
): NewApplicationComment {
  return {
    content,
    authorId,
    createdAt: new Date(),
    applicationId: 0,
  };
}

export function createInterviewCommentFormat(
  content: Array<any>,
  authorId: string,
): NewInterviewComment {
  return {
    content,
    authorId,
    createdAt: new Date(),
    interviewId: 0,
  };
}

export function createDynamicCommentFormat(
  content: Array<any>,
  authorId: string,
): NewDynamicComment {
  return {
    content,
    authorId,
    createdAt: new Date(),
    dynamicId: 0,
  };
}

export const commentCreationMap: Record<
  string,
  (
    content: Array<any>,
    authorId: string,
  ) => NewInterviewComment | NewDynamicComment | NewApplicationComment
> = {
  application: createApplicationCommentFormat,
  interview: createInterviewCommentFormat,
  dynamic: createDynamicCommentFormat,
};
