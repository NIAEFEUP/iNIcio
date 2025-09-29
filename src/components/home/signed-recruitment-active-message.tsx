import RecruiterActiveMessage from "./recruiter-active-message";
import SubmittedApplicationMessage from "./submitted-application-message";

interface SignedRecruitmentActiveMessageProps {
  isRecruiter: boolean;
}

export default function SignedRecruitmentActiveMessage({
  isRecruiter,
}: SignedRecruitmentActiveMessageProps) {
  return (
    <>
      {isRecruiter ? (
        <RecruiterActiveMessage />
      ) : (
        <SubmittedApplicationMessage />
      )}
    </>
  );
}
