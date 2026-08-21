"use client";

import { useState } from "react";
import { Header } from "../components/header";
import { Hero } from "../components/hero";
import { TrustBadges } from "../components/trust-badges";
import { ThreeMoments } from "../components/three-moments";
import { InsideTheBox } from "../components/inside-the-box";
import { CustomizeBoxForm } from "../components/customize-box-form";
import { CartDrawer } from "../components/cart-drawer";
import { Footer } from "../components/footer";
import { CountdownTimer } from "../components/countdown-timer";
import { isPhysicalBoxAvailable } from "../lib/product";
import { LAUNCH_PRICE_DEADLINE } from "../lib/inventory/launch-pricing";

export default function HomePage() {
  const [showCustomize, setShowCustomize] = useState(false);
  const [showCart, setShowCart] = useState(false);

  return (
    <>
      <Header onCartClick={() => setShowCart(true)} />
      <main>
        {isPhysicalBoxAvailable() && <CountdownTimer targetDate={LAUNCH_PRICE_DEADLINE} />}
        <Hero onOrderClick={() => setShowCustomize(true)} />
        <TrustBadges />
        <ThreeMoments />
        <InsideTheBox onOrderClick={() => setShowCustomize(true)} />
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
