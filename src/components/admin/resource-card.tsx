"use client";

import Link from "next/link";
import Image from "next/image";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ResourceCardProps {
  title: string;
  quantityText: string;
  href: string;
}

export default function ResourceCard({
  title,
  quantityText,
  href,
}: ResourceCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full hover:cursor-pointer">
        <CardHeader className="flex flex-row items-center gap-x-4">
          <Image
            src="/logo_2018.svg"
            alt="Logo"
            width={40}
            height={40}
            className="size-10 rounded-full"
          />
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{quantityText}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
