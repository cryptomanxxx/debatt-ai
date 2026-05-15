"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Legend, ResponsiveContainer } from "recharts";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#f8fafc", accentDim: "#aaaaaa",
  text: "#f0ede6", textMuted: "#888880",
  green: "#4ade80", red: "#f87171", yellow: "#f8fafc",
};

const inp = {
  background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: "4px",
  color: C.text, fontFamily: "Georgia, serif", fontSize: "14px",
  padding: "10px 12px", width: "100%", boxSizing: "border-box", outline: "none",
};

function sbHeaders() {
  return {
    "apikey": SB_KEY,
    "Authorization": `Bearer ${SB_KEY}`,
    "Content-Type": "application/json",
  };
}