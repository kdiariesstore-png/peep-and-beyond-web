// Per Oreem's docs: Volumetric Weight = (L × W × H in cm) ÷ 5000, and the
// chargeable weight billed by the carrier is whichever of actual/volumetric is larger.
export function computeChargeableWeightKg(
  actualWeightKg: number,
  lengthCm: number,
  widthCm: number,
  heightCm: number
): number {
  const volumetricWeightKg = (lengthCm * widthCm * heightCm) / 5000;
  return Math.max(actualWeightKg, volumetricWeightKg);
}
