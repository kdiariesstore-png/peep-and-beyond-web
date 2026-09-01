import type { BuilderProductId, CartItem } from "../types";
import { BUILDER_PRODUCTS, PEEP_BOX_PRODUCT, getBuilderProduct, isBuilderKind, isIndividualProductKind } from "../product";
import { computeChargeableWeightKg } from "../payments/chargeable-weight";

export interface ParcelDimensionsCm {
  length: number;
  width: number;
  height: number;
}

export interface PhysicalShippingParcel {
  actualWeightKg: number;
  dimensionsCm: ParcelDimensionsCm;
  chargeableWeightKg: number;
  qty: number;
  packaging: "box" | "mailer";
}

const READY_MADE_CONTENTS: readonly BuilderProductId[] = [
  "story",
  "puzzle",
  "magnetic-map",
  "coloring-book",
  "alphabet-cards",
  "cup",
  "stickers",
  "welcome-card",
];

// Conservative packing allowances supplied by the owner:
// boxed orders receive about 2 cm of protection on every side; standalone products use
// bubble wrap and a shipping mailer only.
export const BOX_PADDING_CM_PER_SIDE = 2;
export const MAILER_PADDING_CM_PER_SIDE = 1;
export const BOX_OUTER_PACKAGING_WEIGHT_GRAMS = 60;
export const MAILER_PACKAGING_WEIGHT_GRAMS = 50;

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function surfaceArea(dimensions: ParcelDimensionsCm): number {
  const { length, width, height } = dimensions;
  return 2 * (length * width + length * height + width * height);
}

function itemSpecs(productIds: readonly BuilderProductId[]) {
  return productIds
    .map((id) => getBuilderProduct(id)?.shipping)
    .filter((spec): spec is NonNullable<ReturnType<typeof getBuilderProduct>>["shipping"] => Boolean(spec));
}

function packedContentDimensions(
  specs: ReturnType<typeof itemSpecs>
): ParcelDimensionsCm {
  if (specs.length === 0) return { length: 1, width: 1, height: 1 };
  const length = Math.max(...specs.map((spec) => Math.max(spec.dimensionsCm.length, spec.dimensionsCm.width)));
  const width = Math.max(...specs.map((spec) => Math.min(spec.dimensionsCm.length, spec.dimensionsCm.width)));
  const maxHeight = Math.max(...specs.map((spec) => spec.dimensionsCm.height));
  const totalVolume = specs.reduce(
    (sum, spec) =>
      sum +
      spec.dimensionsCm.length *
        spec.dimensionsCm.width *
        spec.dimensionsCm.height,
    0
  );
  const volumeHeight = totalVolume / (length * width);
  return { length, width, height: Math.max(maxHeight, volumeHeight) };
}

function withPadding(
  dimensions: ParcelDimensionsCm,
  paddingPerSide: number
): ParcelDimensionsCm {
  const extra = paddingPerSide * 2;
  return {
    length: round3(dimensions.length + extra),
    width: round3(dimensions.width + extra),
    height: round3(dimensions.height + extra),
  };
}

function parcel(
  actualWeightGrams: number,
  dimensionsCm: ParcelDimensionsCm,
  qty: number,
  packaging: PhysicalShippingParcel["packaging"]
): PhysicalShippingParcel {
  const actualWeightKg = round3(actualWeightGrams / 1000);
  return {
    actualWeightKg,
    dimensionsCm,
    chargeableWeightKg: round3(
      computeChargeableWeightKg(
        actualWeightKg,
        dimensionsCm.length,
        dimensionsCm.width,
        dimensionsCm.height
      )
    ),
    qty,
    packaging,
  };
}

function readyMadeParcel(item: CartItem): PhysicalShippingParcel {
  const contents = itemSpecs(READY_MADE_CONTENTS);
  const contentsWeight = contents.reduce((sum, spec) => sum + spec.weightGrams, 0);
  const giftCardWeight = item.customization.giftCard
    ? getBuilderProduct("welcome-card")?.shipping.weightGrams ?? 0
    : 0;
  const box = PEEP_BOX_PRODUCT.shipping;
  const dimensions = withPadding(box.dimensionsCm, BOX_PADDING_CM_PER_SIDE);
  return parcel(
    contentsWeight + giftCardWeight + box.emptyBoxWeightGrams + BOX_OUTER_PACKAGING_WEIGHT_GRAMS,
    dimensions,
    item.quantity,
    "box"
  );
}

function builderParcel(item: CartItem): PhysicalShippingParcel {
  const specs = itemSpecs(item.selectedProductIds ?? []);
  if (item.customization.giftCard) {
    const card = getBuilderProduct("welcome-card")?.shipping;
    if (card) specs.push(card);
  }
  const contentDimensions = packedContentDimensions(specs);
  const boxDimensions = {
    length: Math.max(contentDimensions.length + 1, 12),
    width: Math.max(contentDimensions.width + 1, 10),
    height: Math.max(contentDimensions.height + 1, 3),
  };
  const reference = PEEP_BOX_PRODUCT.shipping;
  const estimatedBoxWeight = Math.max(
    120,
    Math.ceil(
      reference.emptyBoxWeightGrams *
        (surfaceArea(boxDimensions) / surfaceArea(reference.dimensionsCm))
    )
  );
  const contentsWeight = specs.reduce((sum, spec) => sum + spec.weightGrams, 0);
  return parcel(
    contentsWeight + estimatedBoxWeight + BOX_OUTER_PACKAGING_WEIGHT_GRAMS,
    withPadding(boxDimensions, BOX_PADDING_CM_PER_SIDE),
    item.quantity,
    "box"
  );
}

function individualProductsParcel(items: CartItem[]): PhysicalShippingParcel | null {
  const specs = items.flatMap((item) => {
    if (!isIndividualProductKind(item.kind)) return [];
    const productId = item.selectedProductIds?.[0];
    const product = productId ? getBuilderProduct(productId) : undefined;
    return product ? Array.from({ length: item.quantity }, () => product.shipping) : [];
  });
  if (specs.length === 0) return null;
  const contentsWeight = specs.reduce((sum, spec) => sum + spec.weightGrams, 0);
  return parcel(
    contentsWeight + MAILER_PACKAGING_WEIGHT_GRAMS,
    withPadding(packedContentDimensions(specs), MAILER_PADDING_CM_PER_SIDE),
    1,
    "mailer"
  );
}

export function buildPhysicalShippingParcels(items: CartItem[]): PhysicalShippingParcel[] {
  const parcels: PhysicalShippingParcel[] = [];
  for (const item of items) {
    if (isIndividualProductKind(item.kind)) continue;
    parcels.push(isBuilderKind(item.kind) ? builderParcel(item) : readyMadeParcel(item));
  }
  const mailer = individualProductsParcel(items);
  if (mailer) parcels.push(mailer);
  return parcels;
}

export const MEASURED_PRODUCT_WEIGHTS_GRAMS = Object.fromEntries(
  BUILDER_PRODUCTS.map((product) => [product.id, product.shipping.weightGrams])
) as Record<BuilderProductId, number>;
