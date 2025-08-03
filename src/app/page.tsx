import "./globals.css";

import { Button } from "@/components/ui/button";

export default function Home() {
  const isRecruitmentActive = true; // [BACKEND INTEGRATION]

  return (
    <div className="h-full flex flex-col items-center justify-center">
      {isRecruitmentActive ? (
        <>
          <h1 className="font-bold text-5xl px-5 lg:text-9xl md:w-1/2 text-center">
            Queres fazer parte do <span className="text-primary">NIAEFEUP</span>
            ?
          </h1>
          <div className="flex flex-col lg:flex-row justify-center lg:gap-5">
            <Button size="lg" className="mt-10">
              <a href="signup">Regista-te →</a>
            </Button>
            <Button size="lg" variant="outline" className="mt-10" asChild>
              <a
                href="https://niaefeup.pt/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visita o nosso site !
              </a>
            </Button>
          </div>
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
