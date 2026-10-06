"use client";
import { useState, useEffect } from "react";

// Delas av NavArkivLink och NavHistorikLink: ett enda anrop per sidladdning,
// mot den cachade /api/nav-count (inte direkt mot Supabase).
let pending = null;

function hamta() {
  if (!pending) {
    pending = fetch("/api/nav-count")
      .then(r => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return pending;
}

export default function useNavCount(nyckel) {
  const [count, setCount] = useState(null);
  useEffect(() => {
    let aktiv = true;
    hamta().then(d => {
      if (aktiv && typeof d?.[nyckel] === "number") setCount(d[nyckel]);
    });
    return () => { aktiv = false; };
  }, [nyckel]);
  return count;
}
