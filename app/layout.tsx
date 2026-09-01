import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "../lib/i18n/locale-context";
import { CurrencyProvider } from "../lib/currency-context";
import { CartProvider } from "../lib/cart/cart-context";
import { DigitalCartProvider } from "../lib/digital/cart-context";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.peepandbeyond.com"),
  title: "Peep & beyond | اصنع بوكس بيب الخاص فيك",
  description: "اصنع بوكس بيب من 3 منتجات، جهّز بوكسًا مميزًا للإهداء، أو اطلب البوكس الكامل والمنتجات على حدة.",
  openGraph: {
    title: "Peep & beyond | بوكس بطريقتك",
    description: "قصة ولعب وتعلّم في هدية تختار تفاصيلها بنفسك.",
    url: "https://www.peepandbeyond.com",
    siteName: "Peep & beyond",
    images: [{ url: "/images/peep-box-detail.webp", width: 1100, height: 716, alt: "بوكس بيب الحقيقي مع منتجاته" }],
    locale: "ar_BH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Peep & beyond | بوكس بطريقتك",
    description: "قصة ولعب وتعلّم في هدية تختار تفاصيلها بنفسك.",
    images: ["/images/peep-box-detail.webp"],
  },
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
