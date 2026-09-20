"use client";

import { useState } from "react";
import type { BuilderBoxKind } from "../lib/types";
import { Header } from "./header";
import { BoxBuilder } from "./box-builder";
import { CartDrawer } from "./cart-drawer";
import { Footer } from "./footer";
import { useLocale } from "../lib/i18n/locale-context";
import { isReadyToGiftAvailable } from "../lib/product";

export function BuildPageClient({ kind }: { kind: BuilderBoxKind }) {
  const [showCart, setShowCart] = useState(false);
  const { locale } = useLocale();
  const ar = locale === "ar";

  if (kind === "ready-to-gift" && !isReadyToGiftAvailable()) {
    return (
      <>
        <Header onCartClick={() => setShowCart(true)} />
        <main className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
          <h1 className="text-2xl font-black">
            {ar ? "بوكس بيب المميز غير متوفر حاليًا" : "The Ready-to-Gift Peep Box is currently unavailable"}
          </h1>
          <p className="mt-3 text-brown/70">
            {ar
              ? "بقية المنتجات والبوكسات متوفرة كالمعتاد."
              : "Everything else is still available as usual."}
          </p>
          <a href="/" className="button-primary mt-6 inline-block">
            {ar ? "العودة للمتجر" : "Back to shop"}
          </a>
        </main>
        <Footer />
        <CartDrawer open={showCart} onClose={() => setShowCart(false)} />
      </>
    );
  }

  return (
    <>
      <Header onCartClick={() => setShowCart(true)} />
      <BoxBuilder kind={kind} onAdded={() => setShowCart(true)} />
      <Footer />
      <CartDrawer open={showCart} onClose={() => setShowCart(false)} />
    </>
  );
}
