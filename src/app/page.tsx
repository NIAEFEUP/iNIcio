import { isRecruitmentActive } from "@/lib/recruitment";
import "./globals.css";

import { Button } from "@/components/ui/button";
import RecruitmentActiveMessage from "@/components/home/recruitment-active-message";

export default async function Home() {
  const recruitmentActive = await isRecruitmentActive();

  return (
    <div className="h-full flex flex-col items-center">
      {recruitmentActive ? (
        <>
          <RecruitmentActiveMessage />
        </>
      ) : (
        <div className="flex flex-col items-center gap-10 lg:w-1/2">
          <h1 className="font-bold px-5 text-5xl lg:text-9xl text-center">
            De momento <span className="text-primary">não</span> estamos a
            recrutar 😔
          </h1>
          <div className="text-3xl w-[75%] text-justify lg:text-center">
            Se tiveres interesse em juntar-te à equipa do{" "}
            <span className="text-primary">NIAEFEUP</span>, contacta-nos para
            saberes quando vamos abrir o próximo recrutamento.
          </div>{" "}
        </div>
      )}
    </div>
  );
}
