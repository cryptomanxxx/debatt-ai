"use client";
import { useEffect } from "react";

export default function ReadCounter({ artikelId }) {
  useEffect(() => {
    fetch("/api/lasning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: artikelId }),
    }).catch(() => {});
  }, [artikelId]);

  return null;
}
