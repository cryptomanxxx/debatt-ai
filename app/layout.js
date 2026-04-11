export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <body style={{ margin: 0, padding: 0, background: "#0a0a0a" }}>
        {children}
      </body>
    </html>
  );
}
