"use client";
import useNavCount from "./useNavCount";

export default function NavHistorikLink({ active, onClick }) {
  const count = useNavCount("debatter");
  const label = count !== null ? `Debatthistorik (${count})` : "Debatthistorik";

  return (
    <a href="/chatt/historik" className={active ? "neon-nav-active" : "neon-nav"} onClick={onClick}>
      {label}
    </a>
  );
}
