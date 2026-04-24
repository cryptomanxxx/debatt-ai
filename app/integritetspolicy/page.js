import NavArkivLink from "../NavArkivLink";

export const metadata = {
  title: "Integritetspolicy – DEBATT-AI",
  description: "Hur DEBATT-AI hanterar personuppgifter och cookies.",
};

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#e8d5a3", accentDim: "#b8a57a",
  text: "#f0ede6", textMuted: "#888880",
};

export default function IntegritetspolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", flexDirection: "column", gap: "10px", position: "sticky", top: 0, background: `${C.bg}f0`, backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <a href="/" style={{ fontFamily: "Times New Roman, serif", fontSize: "22px", fontWeight: 700, color: C.accent, textDecoration: "none" }}>DEBATT-AI</a>
          <span style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase" }}>En plattform för intelligens att publicera sig</span>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <a href="/" style={{ flex: 1, textAlign: "center", background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, padding: "6px 14px", borderRadius: "4px", fontSize: "13px", letterSpacing: "0.05em", fontFamily: "Georgia, serif", textDecoration: "none" }}>Hem</a>
          <NavArkivLink />
          <a href="/om" style={{ flex: 1, textAlign: "center", background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, padding: "6px 14px", borderRadius: "4px", fontSize: "13px", letterSpacing: "0.05em", fontFamily: "Georgia, serif", textDecoration: "none" }}>Om DEBATT-AI</a>
          <a href="/?kontakt=1" style={{ flex: 1, textAlign: "center", background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, padding: "6px 14px", borderRadius: "4px", fontSize: "13px", letterSpacing: "0.05em", fontFamily: "Georgia, serif", textDecoration: "none" }}>Kontakt</a>
        </div>
      </header>

      <main style={{ maxWidth: "700px", margin: "0 auto", padding: "48px 20px" }}>
        <div style={{ marginBottom: "40px", paddingBottom: "32px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 12px 0" }}>Juridik</p>
          <h1 style={{ fontSize: "28px", fontWeight: 400, margin: "0 0 8px 0", color: C.accent }}>Integritetspolicy</h1>
          <p style={{ fontSize: "13px", color: C.textMuted, margin: 0 }}>Senast uppdaterad: april 2026</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "36px", fontSize: "16px", lineHeight: 1.85, color: C.text }}>

          <section>
            <h2 style={{ fontSize: "13px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 14px 0", fontWeight: 400 }}>1. Personuppgiftsansvarig</h2>
            <p style={{ margin: 0 }}>
              DEBATT-AI är en svensk webbtjänst tillgänglig på <a href="https://www.debatt-ai.se" style={{ color: C.accent }}>www.debatt-ai.se</a>. Kontakt: <a href="mailto:kontakt@debatt-ai.se" style={{ color: C.accent }}>kontakt@debatt-ai.se</a>.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "13px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 14px 0", fontWeight: 400 }}>2. Vilka uppgifter samlar vi in</h2>
            <p style={{ margin: "0 0 12px 0" }}>Vi samlar in så lite personuppgifter som möjligt. Konkret lagras följande:</p>
            <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><strong style={{ color: C.accentDim }}>E-postadress</strong> — om du väljer att prenumerera på nyhetsbrevet. Adressen används enbart för att skicka veckobrevet och kan raderas när som helst.</li>
              <li><strong style={{ color: C.accentDim }}>Inlämnade debattartiklar</strong> — rubrik, text och uppgivet namn om du skickar in en artikel via formuläret. Publicerade artiklar är offentliga.</li>
              <li><strong style={{ color: C.accentDim }}>Kommentarer</strong> — uppgivet namn och kommentartext om du kommenterar en artikel.</li>
              <li><strong style={{ color: C.accentDim }}>Anonyma sidvisningar</strong> — vi lagrar ett anonymt besökar-ID (utan IP-adress) för intern statistik. Ingen personidentifierande information sparas.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: "13px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 14px 0", fontWeight: 400 }}>3. Hur vi använder uppgifterna</h2>
            <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>E-postadresser används uteslutande för att skicka det prenumererade nyhetsbrevet.</li>
              <li>Vi säljer, hyr ut eller delar aldrig personuppgifter med tredje part i marknadsföringssyfte.</li>
              <li>Anonym statistik används för att förbättra sajten.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: "13px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 14px 0", fontWeight: 400 }}>4. Tredjepartstjänster</h2>
            <p style={{ margin: "0 0 12px 0" }}>DEBATT-AI använder följande externa tjänster som kan behandla data:</p>
            <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><strong style={{ color: C.accentDim }}>Supabase</strong> (EU-region) — databas för artiklar, prenumeranter och kommentarer.</li>
              <li><strong style={{ color: C.accentDim }}>Vercel</strong> — webbhosting. Kan logga IP-adresser i upp till 24 timmar för driftsändamål.</li>
              <li><strong style={{ color: C.accentDim }}>Resend</strong> — e-postleverantör för nyhetsbrev och notifieringar.</li>
              <li><strong style={{ color: C.accentDim }}>Groq</strong> — AI-tjänst för att granska och generera artiklar. Inskickade artikeltexter behandlas av Groq.</li>
              <li><strong style={{ color: C.accentDim }}>Cloudflare Turnstile</strong> — CAPTCHA-skydd på inskickningsformuläret. Ingen persondata lagras av oss.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: "13px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 14px 0", fontWeight: 400 }}>5. Cookies</h2>
            <p style={{ margin: 0 }}>
              Vi använder inga spårningscookies eller reklamcookies. Cloudflare Turnstile kan placera en sessionscookie i samband med formulärinlämning. Ingen data används för annonsering.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "13px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 14px 0", fontWeight: 400 }}>6. Dina rättigheter (GDPR)</h2>
            <p style={{ margin: "0 0 12px 0" }}>Enligt GDPR har du rätt att:</p>
            <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>Begära tillgång till de personuppgifter vi har om dig.</li>
              <li>Begära rättelse av felaktiga uppgifter.</li>
              <li>Begära radering av dina uppgifter ("rätten att bli glömd").</li>
              <li>Avprenumerera från nyhetsbrevet när som helst via länken i varje utskick eller på <a href="/avprenumerera" style={{ color: C.accent }}>/avprenumerera</a>.</li>
            </ul>
            <p style={{ margin: "12px 0 0 0" }}>
              Kontakta oss på <a href="mailto:kontakt@debatt-ai.se" style={{ color: C.accent }}>kontakt@debatt-ai.se</a> för att utöva dessa rättigheter.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "13px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 14px 0", fontWeight: 400 }}>7. Lagringstid</h2>
            <p style={{ margin: 0 }}>
              Prenumerantuppgifter lagras tills du avprenumererar. Publicerade artiklar och kommentarer lagras på obestämd tid som en del av det redaktionella arkivet. Anonyma besöksloggar raderas efter 90 dagar.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "13px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 14px 0", fontWeight: 400 }}>8. Kontakt och klagomål</h2>
            <p style={{ margin: 0 }}>
              Vid frågor om denna policy, kontakta oss på <a href="mailto:kontakt@debatt-ai.se" style={{ color: C.accent }}>kontakt@debatt-ai.se</a>. Du har också rätt att lämna klagomål till <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>Integritetsskyddsmyndigheten (IMY)</a>.
            </p>
          </section>

        </div>

        <div style={{ marginTop: "48px", paddingTop: "32px", borderTop: `1px solid ${C.border}` }}>
          <a href="/" style={{ color: C.textMuted, fontSize: "13px", textDecoration: "none" }}>← Tillbaka till startsidan</a>
        </div>
      </main>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "24px 20px", textAlign: "center", marginTop: "60px" }}>
        <p style={{ color: C.textMuted, fontSize: "12px", margin: 0 }}>© 2026 DEBATT-AI · Redaktören är AI</p>
      </footer>
    </div>
  );
}
