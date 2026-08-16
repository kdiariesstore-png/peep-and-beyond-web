"use client";

import { useState } from "react";
import { Header } from "../components/header";
import { Hero } from "../components/hero";
import { TrustBadges } from "../components/trust-badges";
import { ThreeMoments } from "../components/three-moments";
import { CustomizeBoxForm } from "../components/customize-box-form";
import { CartDrawer } from "../components/cart-drawer";
import { Footer } from "../components/footer";

export default function HomePage() {
  const [showCustomize, setShowCustomize] = useState(false);
  const [showCart, setShowCart] = useState(false);

  return (
    <>
      <Header onCartClick={() => setShowCart(true)} />
      <main>
        <Hero onOrderClick={() => setShowCustomize(true)} />
        <TrustBadges />
        <ThreeMoments />
        <section id="inside" className="px-6 py-10 text-center">
          <button
            type="button"
            onClick={() => setShowCustomize(true)}
            className="rounded-full bg-leaf px-6 py-3 text-white"
          >
            جهّز بوكسك
          </button>
        </section>
      </main>
      <Footer />

      {showCustomize && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-cream">
            <CustomizeBoxForm onDone={() => setShowCustomize(false)} />
          </div>
        </div>
      )}

      <CartDrawer open={showCart} onClose={() => setShowCart(false)} />
    </>
  );
}
