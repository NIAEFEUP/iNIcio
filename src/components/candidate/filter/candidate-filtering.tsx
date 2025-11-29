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
import { Input } from "@/components/ui/input";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { CandidateWithMetadata } from "@/lib/candidate";
import { User } from "@/lib/db";

import {
  availableClassifications,
  availableCourses,
  availableCurricularYears,
} from "@/lib/constants";

type CandidatesPageFilter = {
  course: string;
  year: string;
  departments: string[];
  classifications: string[];
  decision: string;
};

interface CandidateFilteringProps {
  candidates: Array<CandidateWithMetadata>;
  setFilteredCandidates: Dispatch<SetStateAction<Array<User>>>;
  availableDepartments: Array<string>;
}

export default function CandidateFiltering({
  candidates,
  setFilteredCandidates,
  availableDepartments,
}: CandidateFilteringProps) {
  const [query, setQuery] = useState<string>("");

  const [filters, setFilters] = useState<CandidatesPageFilter>({
    course: "all",
    year: "all",
    departments: [] as string[],
    classifications: [] as string[],
    decision: "all",
  });

  const hasActiveFilters =
    filters.course !== "all" ||
    filters.year !== "all" ||
    filters.departments.length > 0 ||
    filters.classifications.length > 0 ||
    filters.decision !== "all";

  useEffect(() => {
    if (!query.trim()) setFilteredCandidates(candidates);

    setFilteredCandidates(
      candidates.filter(
        (c) =>
          c.name?.toLowerCase().trim().includes(query.toLowerCase().trim()) ||
          c.email?.toLowerCase().trim().includes(query.toLowerCase().trim()) ||
          `${c.application.studentNumber}`
            .toLowerCase()
            .trim()
            .includes(query.toLowerCase().trim()),
      ),
    );
  }, [query, candidates, setFilteredCandidates]);

  useEffect(() => {
    if (!hasActiveFilters) {
      setFilteredCandidates(candidates);
      return;
    }

    let filtered = [...candidates];

    if (filters.departments.length > 0) {
      filtered = filtered.filter((c) =>
        c.application.interests.some((i) =>
          filters.departments.includes(i.toLowerCase()),
        ),
      );
    }

    if (filters.course !== "all") {
      filtered = filtered.filter(
        (c) => c.application.degree === filters.course,
      );
    }

    if (filters.year !== "all") {
      filtered = filtered.filter(
        (c) => c.application.curricularYear === filters.year,
      );
    }

    if (filters.classifications.length > 0) {
      filtered = filtered.filter((c) =>
        filters.classifications.includes(c.interviewClassification),
      );
    }

    if (filters.decision !== "all") {
      filtered = filtered.filter((c) => {
        if (filters.decision === "approved") {
          return c.votingDecision?.decision === "approve";
        }
        if (filters.decision === "rejected") {
          return c.votingDecision?.decision === "reject";
        }
        if (filters.decision === "pending") {
          return !c.votingDecision;
        }
        return true;
      });
    }
    setFilteredCandidates(filtered);
  }, [filters, candidates, hasActiveFilters, setFilteredCandidates]);

  const handleDepartmentFilter = (department: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      departments: checked
        ? [...prev.departments, department]
        : prev.departments.filter((d) => d !== department),
    }));
  };

  const handleClassificationFilter = (
    classification: string,
    checked: boolean,
  ) => {
    setFilters((prev) => ({
      ...prev,
      classifications: checked
        ? [...prev.classifications, classification]
        : prev.classifications.filter((c) => c !== classification),
    }));
  };

  const clearFilters = () => {
    setFilters({
      course: "all",
      year: "all",
      departments: [],
      classifications: [],
      decision: "all",
    });
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 justify-between mx-auto w-full max-w-[90em]">
        <Input
          placeholder="Pesquisar"
          className="w-128 mx-4"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        ></Input>
        <div className="flex flex-row flex-wrap items-center gap-4 mx-4">
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

          <Select
            value={filters.decision}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, decision: value }))
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Decisão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Decisão</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
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

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Classificações
                {filters.classifications.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {filters.classifications.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">
                  Filtrar por classificação
                </h4>
                <div className="space-y-2">
                  {availableClassifications.map((classification) => (
                    <div
                      key={classification}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={classification}
                        checked={filters.classifications.includes(
                          classification,
                        )}
                        onCheckedChange={(checked) =>
                          handleClassificationFilter(
                            classification,
                            checked as boolean,
                          )
                        }
                      />
                      <label
                        htmlFor={classification}
                        className="text-sm font-normal"
                      >
                        {classification}
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

      <div className="w-full mx-auto max-w-[80em]">
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
            {filters.decision !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Decisão:{" "}
                {filters.decision === "approved"
                  ? "Aprovado"
                  : filters.decision === "rejected"
                    ? "Rejeitado"
                    : "Pendente"}
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, decision: "all" }))
                  }
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            )}
            {filters.classifications.map((classification) => (
              <Badge key={classification} variant="secondary" className="gap-1">
                {classification}
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      classifications: prev.classifications.filter(
                        (c) => c !== classification,
                      ),
                    }))
                  }
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            ))}
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
    </>
  );
}
