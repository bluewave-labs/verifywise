export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};