"use client";

import { Input } from "@/components/ui/input";
import { Application, RecruiterToCandidate, User } from "@/lib/db";
import { useEffect, useState } from "react";
import CandidateQuickInfo from "../candidate/page/candidate-quick-info";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { availableCourses, availableCurricularYears } from "@/lib/constants";

interface CandidatesClientProps {
  candidates: Array<
    User & {
      knownRecruiters: RecruiterToCandidate[];
    } & {
      dynamic: { candidateId: string; dynamicId: number };
      application: (Application & { interests: string[] }) | null;
    }
  >;
  availableDepartments: Array<string>;
}

type CandidatesPageFilter = {
  course: string;
  year: string;
  departments: string[];
};

export default function CandidatesClient({
  candidates,
  availableDepartments,
}: CandidatesClientProps) {
  const [query, setQuery] = useState<string>("");
  const [filters, setFilters] = useState<CandidatesPageFilter>({
    course: "all",
    year: "all",
    departments: [] as string[],
  });

  const hasActiveFilters =
    filters.course !== "all" ||
    filters.year !== "all" ||
    filters.departments.length > 0;

  const [filteredCandidates, setFilteredCandidates] =
    useState<Array<User>>(candidates);

  useEffect(() => {
    if (!query.trim()) setFilteredCandidates(candidates);

    setFilteredCandidates(
      candidates.filter((c) =>
        c.name.toLowerCase().trim().includes(query.toLowerCase().trim()),
      ),
    );
  }, [query, candidates]);

  useEffect(() => {
    if (!hasActiveFilters) {
      setFilteredCandidates(candidates);
      return;
    }

    if (filters.departments.length > 0) {
      setFilteredCandidates(
        candidates.filter((c) =>
          c.application.interests.some((i) =>
            filters.departments.includes(i.toLowerCase()),
          ),
        ),
      );
    }

    if (filters.course !== "all") {
      setFilteredCandidates(
        candidates.filter((c) => c.application.degree === filters.course),
      );
    }

    if (filters.year !== "all") {
      setFilteredCandidates(
        candidates.filter((c) => c.application.curricularYear === filters.year),
      );
    }
  }, [filters, candidates, hasActiveFilters]);

  const handleDepartmentFilter = (department: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      departments: checked
        ? [...prev.departments, department]
        : prev.departments.filter((d) => d !== department),
    }));
  };

  const clearFilters = () => {
    setFilters({
      course: "all",
      year: "all",
      departments: [],
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between mx-64">
        <Input
          placeholder="Pesquisar"
          className="w-128"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        ></Input>
        <div className="flex flex-wrap items-center gap-4">
          <Select
            value={filters.course}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, course: value }))
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cursos</SelectItem>
              {availableCourses.map((course) => (
                <SelectItem key={course} value={course}>
                  <span className="uppercase">{course}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.year}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, year: value }))
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Ano</SelectItem>
              {availableCurricularYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Departamentos
                {filters.departments.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {filters.departments.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">
                  Filtrar por departamentos
                </h4>
                <div className="space-y-2">
                  {availableDepartments.map((department) => (
                    <div
                      key={department}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={department}
                        checked={filters.departments.includes(department)}
                        onCheckedChange={(checked) =>
                          handleDepartmentFilter(department, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={department}
                        className="text-sm font-normal"
                      >
                        {department}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      <div className="mx-64">
        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.course !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Curso: {filters.course}
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, course: "all" }))
                  }
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            )}
            {filters.year !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Ano: {filters.year}
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, year: "all" }))
                  }
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            )}
            {filters.departments.map((dept) => (
              <Badge key={dept} variant="secondary" className="gap-1">
                {dept}
                <button
                  onClick={() => handleDepartmentFilter(dept, false)}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="mx-64 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredCandidates.map(
          (
            candidate: User & {
              knownRecruiters: RecruiterToCandidate[];
            } & {
              dynamic: { candidateId: string; dynamicId: number };
              application: (Application & { interests: string[] }) | null;
            },
          ) => (
            <CandidateQuickInfo
              key={candidate.id}
              candidate={candidate}
              application={candidate.application}
              applicationInterests={candidate.application.interests}
              dynamic={null}
              friendCheckboxActive={true}
              friends={candidate.knownRecruiters}
            />
          ),
        )}

        {filteredCandidates.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">
            Nenhum resultado encontrado
          </p>
        )}
      </div>
    </div>
  );
}
