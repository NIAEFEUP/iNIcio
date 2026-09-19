"use client";

import { usePathname, useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Recruitment } from "@/lib/db";

interface RecruitmentSelectorProps {
  recruitments: Array<Recruitment>;
  selectedId?: number;
}

export default function RecruitmentSelector({
  recruitments,
  selectedId,
}: RecruitmentSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select
      value={selectedId?.toString() ?? ""}
      onValueChange={(value) =>
        router.replace(`${pathname}?recruitmentId=${value}`, { scroll: false })
      }
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecionar recrutamento" />
      </SelectTrigger>
      <SelectContent>
        {recruitments.map((recruitment) => (
          <SelectItem key={recruitment.id} value={recruitment.id.toString()}>
            {recruitment.lectiveYear} — {recruitment.semester}º Semestre
            {recruitment.active ? " (Ativo)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
