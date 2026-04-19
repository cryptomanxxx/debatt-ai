"use client";
import { useEffect } from "react";

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export default function VisitorTracker() {
  useEffect(() => {
    try {
      let id = localStorage.getItem("debatt_visitor_id");
      if (!id) { id = uuidv4(); localStorage.setItem("debatt_visitor_id", id); }
      const today = new Date().toISOString().slice(0, 10);
      const lastVisit = localStorage.getItem("debatt_last_visit");
      if (lastVisit === today) return;
      localStorage.setItem("debatt_last_visit", today);
      fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitor_id: id }),
      }).catch(() => {});
    } catch { /* localStorage blocked */ }
  }, []);
  return null;
}
