import { headers as getHeaders } from "next/headers.js";
import Image from "next/image";
import { getPayload } from "payload";
import React from "react";
import { fileURLToPath } from "url";

import config from "@/payload.config";
import "./styles.css";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const headers = await getHeaders();
  const payloadConfig = await config;
  const payload = await getPayload({ config: payloadConfig });
  const { user } = await payload.auth({ headers });

  const fileURL = `vscode://file/${fileURLToPath(import.meta.url)}`;

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <h1 className="font-bold text-9xl w-1/2 text-center">
        Queres fazer parte do <span className="text-primary">NIAEFEUP</span>?
      </h1>
      <div className="flex justify-center">
        <button className="mt-10 rounded-full text-primary">
          <a href="registo">Registar-te →</a>
        </button>
        <Button className="mt-10">
          <a href="registo">Regista-te !</a>
        </Button>
        <Button className="mt-10" asChild>
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
