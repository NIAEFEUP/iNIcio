"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import Image from "next/image";

interface ResourceCardProps {
  title: string;
  quantityText: string;
  onClick: () => void;
}

export default function ResourceCard({
  title,
  quantityText,
  onClick,
}: ResourceCardProps) {
  return (
    <Card className="hover:cursor-pointer" onClick={onClick}>
      <CardHeader className="flex flex-row items-center gap-x-4">
        <Image
          src="/logo_2018.svg"
          alt="Logo"
          width={40}
          height={40}
          className="rounded-full"
        />
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{quantityText}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}
