import Image from "next/image";
import "./globals.css";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <h1 className="font-bold text-9xl w-1/2 text-center">
        Queres fazer parte do <span className="text-primary">NIAEFEUP</span>?
      </h1>
      <div className="flex justify-center gap-5">
        <Button size="lg" className="mt-10">
          <a href="registo">Regista-te →</a>
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
    </div>
  );
}
