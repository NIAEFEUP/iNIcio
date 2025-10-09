"use client";

import { useState } from "react";
import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock,
  Zap,
  BookOpen,
  Award,
  MessageSquare,
  Users,
  Target,
  Calendar,
} from "lucide-react";

interface Skill {
  label: string;
  value: number | null;
  icon: React.ReactNode;
}

export function CandidateClassification() {
  const [skills, setSkills] = useState<Skill[]>([
    { label: "Disponibilidade", value: 5, icon: <Clock className="w-4 h-4" /> },
    { label: "Motivação", value: 5, icon: <Zap className="w-4 h-4" /> },
    {
      label: "Espírito Crítico",
      value: 3,
      icon: <BookOpen className="w-4 h-4" />,
    },
    { label: "Experiência", value: 5, icon: <Award className="w-4 h-4" /> },
    {
      label: "Comunicação",
      value: 4,
      icon: <MessageSquare className="w-4 h-4" />,
    },
    { label: "Team Player", value: 4, icon: <Users className="w-4 h-4" /> },
    { label: "Liderança", value: 4, icon: <Target className="w-4 h-4" /> },
    { label: "Juni", value: null, icon: <Calendar className="w-4 h-4" /> },
  ]);

  const handleValueChange = (index: number, value: string) => {
    const numValue = value === "" ? null : Number(value);
    setSkills((prevSkills) =>
      prevSkills.map((skill, i) =>
        i === index ? { ...skill, value: numValue } : skill,
      ),
    );
  };

  const getBadgeColor = (value: number | null) => {
    if (value === null) return "bg-muted text-muted-foreground";
    if (value === 5) return "bg-emerald-600 text-white";
    if (value === 4) return "bg-amber-600 text-white";
    return "bg-orange-600 text-white";
  };

  return (
    <Card className="w-full bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Classificação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {skills.map((skill, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground">{skill.icon}</div>
              <span className="text-sm font-medium text-foreground">
                {skill.label}
              </span>
            </div>
            <select
              value={skill.value ?? ""}
              onChange={(e) => handleValueChange(index, e.target.value)}
              className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary min-w-[70px] text-center ${getBadgeColor(skill.value)}`}
            >
              <option value="">Empty</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
