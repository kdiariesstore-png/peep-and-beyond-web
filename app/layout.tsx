import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "../lib/i18n/locale-context";
import { CurrencyProvider } from "../lib/currency-context";
import { CartProvider } from "../lib/cart/cart-context";
import { DigitalCartProvider } from "../lib/digital/cart-context";

export const metadata: Metadata = {
  title: "Peep & beyond | Peep Box",
  description: "بوكس بيب — قصة، لعب، وتعلّم بعيدًا عن الشاشات.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <LocaleProvider>
          <CurrencyProvider>
            <CartProvider>
              <DigitalCartProvider>{children}</DigitalCartProvider>
            </CartProvider>
          </CurrencyProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
