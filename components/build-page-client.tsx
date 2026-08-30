"use client";

import { useState } from "react";
import type { PhysicalBoxKind } from "../lib/types";
import { Header } from "./header";
import { BoxBuilder } from "./box-builder";
import { CartDrawer } from "./cart-drawer";
import { Footer } from "./footer";

export function BuildPageClient({ kind }: { kind: Exclude<PhysicalBoxKind, "ready-made"> }) {
  const [showCart, setShowCart] = useState(false);
  return (
    <>
      <Header onCartClick={() => setShowCart(true)} />
      <BoxBuilder kind={kind} onAdded={() => setShowCart(true)} />
      <Footer />
      <CartDrawer open={showCart} onClose={() => setShowCart(false)} />
    </>
  );
}
