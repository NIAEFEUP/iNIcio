"use client";

import Link from "next/link";
import { useState } from "react";

import { ChevronUp, ChevronDown } from "lucide-react";
import type { User } from "@/lib/auth";

type Props = {
  className?: string;
  user: User | null;
};

export default function Navbar({ className, user }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav
      className={`${className} flex flex-col md:flex-row justify-between p-5 text-2xl shadow-sm mb-20`}
    >
      <div className="flex justify-between items-center">
        <Link href="/">
          <img src="/logo.svg" alt="Logo" />
        </Link>
        <button
          className="md:hidden text-2xl"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <ChevronUp /> : <ChevronDown />}
        </button>
      </div>

      <div
        className={`flex-col md:flex-row flex gap-5 transition-all duration-300 ease-in-out ${
          isMenuOpen
            ? "mt-5 opacity-100 max-h-screen"
            : "opacity-0 max-h-0 overflow-hidden"
        } md:opacity-100 md:max-h-full md:overflow-visible md:flex`}
      >
        <Link href="https://niaefeup.pt">Site do NI</Link>
        <Link href="/alocacoes">Alocações</Link>
        <Link href="/candidates">Candidatos</Link>
        {!user ? (
          <>
            <Link href="/login">Login</Link>
            <Link href="/signup">
              <span className="text-primary">Registo</span>
            </Link>
          </>
        ) : (
          <Link className="text-primary" href="/perfil">
            <span className="text-primary">Perfil</span>
          </Link>
        )}

        {user && user.role === "admin" ? (
          <Link className="text-primary" href="/admin">
            <span className="text-primary">AdminUI</span>
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
