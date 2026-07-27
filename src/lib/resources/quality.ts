export function mixQuality(
  existingQuantity: number,
  existingQuality: number,
  addedQuantity: number,
  addedQuality: number
): number {
  if (existingQuantity + addedQuantity <= 0) return 1.0;

  return (
    (existingQuantity * existingQuality + addedQuantity * addedQuality) /
    (existingQuantity + addedQuantity)
  );
}
