"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function TT({ contentStyle, ...props }) {
  return (
    <Tooltip
      {...props}
      contentStyle={{ background: "#111", border: "1px solid #333", fontFamily: "monospace", fontSize: 12, borderRadius: 6, ...contentStyle }}
      cursor={{ fill: "#ffffff08" }}
    />
  );
}

function kortNamn(name) {
  const map = {
    "Nationalekonom": "Nat.ek.",
    "Kryptoanalytiker": "Krypto",
    "Konservativ debattör": "Konserv.",
    "Teknikoptimist": "Teknik",
    "Hypokondrikern": "Hypok.",
    "Miljöaktivist": "Miljö",
    "Den nostalgiske": "Nostalgiske",
    "Den stressade": "Stressade",
    "Den hungriga": "Hungriga",
  };
  return map[name] || name;
}

export default function OligarkiGraf({ typ, data }) {
  if (typ === "wealth") {
    return (
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 80 }}>
          <XAxis dataKey="agent" tickFormatter={kortNamn} tick={{ fill: "#666", fontSize: 10, fontFamily: "monospace" }} angle={-45} textAnchor="end" interval={0} />
          <YAxis tick={{ fill: "#555", fontSize: 10, fontFamily: "monospace" }} />
          <TT formatter={(v) => [`${v} kr`, "Saldo"]} />
          <Bar dataKey="saldo" radius={[2, 2, 0, 0]} maxBarSize={32}>
            {data.map((d, i) => <Cell key={i} fill={d.farg} fillOpacity={i < 3 ? 1 : 0.45} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (typ === "makt") {
    return (
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 80 }}>
          <XAxis dataKey="agent" tickFormatter={kortNamn} tick={{ fill: "#666", fontSize: 10, fontFamily: "monospace" }} angle={-45} textAnchor="end" interval={0} />
          <YAxis domain={[0, 100]} tick={{ fill: "#555", fontSize: 10, fontFamily: "monospace" }} />
          <TT formatter={(v, name) => {
            const L = { makt: "Maktindex", saldo: "Saldo (kr)", syms: "Symboler", koal: "Koal.styrka" };
            return [v, L[name] || name];
          }} />
          <Bar dataKey="makt" radius={[2, 2, 0, 0]} maxBarSize={40}>
            {data.map((d, i) => <Cell key={i} fill={d.farg} fillOpacity={i < 3 ? 1 : 0.55} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
