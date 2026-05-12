export const calculateAutoPercentages = (count: number): number => {
  if (count === 0) return 0;
  return parseFloat((100 / count).toFixed(2));
};