"use client";
import useNavCount from "./useNavCount";

export default function NavArkivLink({ onClick }) {
  const count = useNavCount("artiklar");

  return (
    <a href="/arkiv" className="neon-nav" onClick={onClick}>
      {count !== null ? `Arkiv (${count})` : "Arkiv"}
    </a>
  );
}
