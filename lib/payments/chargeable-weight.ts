export function computeChargeableWeightKg(
  actualWeightKg: number,
  lengthCm: number,
  widthCm: number,
  heightCm: number
): number {
  const volumetricWeightKg = (lengthCm * widthCm * heightCm) / 5000;
  return Math.max(actualWeightKg, volumetricWeightKg);
}
