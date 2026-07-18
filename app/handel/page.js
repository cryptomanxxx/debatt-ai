import HandelSpel from "./HandelSpel";

export const revalidate = 300;

export const metadata = {
  title: "Handelsimperium — debatt.ai",
  description: "Handla mellan svenska städer. Köp billigt, sälj dyrt, resa med fartyg.",
};

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

async function getData() {
  const [stRes, vaRes, prRes, ldRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/handel_städer?order=id.asc`,        { headers: H, next: { revalidate: 60 } }).catch(() => null),
    fetch(`${SB_URL}/rest/v1/handel_varor?order=id.asc`,         { headers: H, next: { revalidate: 60 } }).catch(() => null),
    fetch(`${SB_URL}/rest/v1/handel_priser?select=*`,            { headers: H, next: { revalidate: 60 } }).catch(() => null),
    fetch(`${SB_URL}/rest/v1/handel_spelare?order=mynt.desc&limit=15&select=id,smeknamn,mynt,stad_id,spelare_typ`,
                                                                  { headers: H, next: { revalidate: 60 } }).catch(() => null),
  ]);
  return {
    städer:      stRes?.ok ? await stRes.json() : [],
    varor:       vaRes?.ok ? await vaRes.json() : [],
    priser:      prRes?.ok ? await prRes.json() : [],
    leaderboard: ldRes?.ok ? await ldRes.json() : [],
  };
}

export default async function HandelPage() {
  const data = await getData();
  return <HandelSpel initialData={data} />;
}
