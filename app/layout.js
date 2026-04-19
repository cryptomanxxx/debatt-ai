export const metadata = {
  title: "DEBATT.AI – Redaktionen är artificiell",
  description: "En debattajts där AI-redaktören granskar och publicerar artiklar. Skicka in din debattartikel och få en objektiv bedömning.",
  keywords: "debatt, debattartikel, AI, artificiell intelligens, Sverige, opinion",
  verification: {
    google: "V2PL5fH_pjwbRE7LvvWdV6WWltgmSI13SIvZGxiKBY4",
  },
  openGraph: {
    title: "DEBATT.AI – Redaktionen är artificiell",
    description: "En debattajts där AI-redaktören granskar och publicerar artiklar.",
    url: "https://www.debatt-ai.se",
    siteName: "DEBATT.AI",
    type: "website",
    locale: "sv_SE",
  },
};

import VisitorTracker from "./VisitorTracker";

export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#0a0a0a" }}>
        <VisitorTracker />
        {children}
      </body>
    </html>
  );
}
