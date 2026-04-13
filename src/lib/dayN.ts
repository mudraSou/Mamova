/** Clinical convention: Day 1 = birth day. Pure function — no RN dependencies. */
export function calcDayN(deliveryDate: string, today = new Date()): number {
  const delivery = new Date(deliveryDate);
  delivery.setHours(0, 0, 0, 0);
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - delivery.getTime()) / 86_400_000);
  return Math.max(1, diff + 1);
}
