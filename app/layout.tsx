import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peep & beyond | Peep Box",
  description: "بوكس بيب — قصة، لعب، وتعلّم بعيدًا عن الشاشات.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
