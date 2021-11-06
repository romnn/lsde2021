export type Country = {
  code: string;
  group: string;
  name: string;
};

export const shuffleArray = (a: any[]): void => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = a[i];
    a[i] = a[j];
    a[j] = temp;
  }
};

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
