export const isSameDate = (
  d1: Date | null | undefined,
  d2: Date | null | undefined
): boolean => {
  if (d1 === null || d1 === undefined) return false;
  if (d2 === null || d2 === undefined) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};
