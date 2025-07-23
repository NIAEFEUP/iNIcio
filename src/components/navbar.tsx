import Image from "next/image";
import Link from "next/link";

type Props = {
  className?: string;
  role: string;
};

export default function Navbar({ className, role }: Props) {
  const isAuthenticated = true;

  return (
    <div className={`${className} flex justify-between p-5 text-2xl shadow-sm`}>
      <Link href="/">
        <img src="/logo.svg" />
      </Link>

      <div className="flex gap-5">
        <Link href="https://niaefeup.pt">Site do NI</Link>
        <Link href="/alocacoes">Alocações</Link>
        <Link href="/candidatos">Candidatos</Link>
        {!isAuthenticated ? (
          <>
            <Link href="/login">Login</Link>
            <Link href="/registo">
              <span className="text-primary">Registo</span>
            </Link>
          </>
        ) : (
          <Link className="text-primary" href="/perfil">
            <span className="text-primary">Perfil</span>
          </Link>
        )}

        {role == "admin" ? (
          <Link className="text-primary" href="/admin">
            <span className="text-primary">AdminUI</span>
          </Link>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}
