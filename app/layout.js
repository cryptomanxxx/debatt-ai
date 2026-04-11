export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <head><title>DEBATT.AI</title></head>
      <body style={{ margin: 0, background: "#0a0a0a" }}>
        {children}
      </body>
    </html>
  );
}
