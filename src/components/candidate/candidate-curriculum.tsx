"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import type { Application } from "@/lib/db";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface CandidateCurriculumProps {
  application: Application;
  candidateId: string;
}

function PdfFallback({ source }: { source: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p>Não foi possível visualizar o currículo.</p>
      <a
        href={source}
        target="_blank"
        rel="noreferrer"
        className="text-primary underline underline-offset-4"
      >
        Abrir ou descarregar o PDF
      </a>
    </div>
  );
}

export default function CandidateCurriculum({
  application,
  candidateId,
}: CandidateCurriculumProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState<number>();
  const [pageCount, setPageCount] = useState<number>();
  const source = `/api/candidate/${candidateId}/curriculum`;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updatePageWidth = () => {
      setPageWidth(Math.max(container.clientWidth - 32, 1));
    };

    updatePageWidth();
    const observer = new ResizeObserver(updatePageWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  if (!application?.curriculum) {
    return <p className="text-center">Não tem currículo.</p>;
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto bg-muted/30 p-4">
      <Document
        file={source}
        className="flex flex-col items-center gap-4"
        loading={<p className="text-center">A carregar o currículo...</p>}
        error={<PdfFallback source={source} />}
        onLoadSuccess={({ numPages }) => setPageCount(numPages)}
      >
        {pageWidth &&
          pageCount &&
          Array.from({ length: pageCount }, (_, index) => (
            <Page
              key={index + 1}
              pageNumber={index + 1}
              width={pageWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-md"
            />
          ))}
      </Document>
    </div>
  );
}
