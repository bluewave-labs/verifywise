import { overviews } from "../overviews/overviews.data";

export const getAllMockOverviews = (): Array<any> => {
  return overviews;
};

export const getMockOverviewById = (id: number): object | undefined => {
  return overviews.find((overview) => overview.id === id);
};

export const createMockOverview = (newOverview: any): object => {
  overviews.push(newOverview);
  return newOverview;
};

export const updateMockOverviewById = (id: number, updatedOverview: any): object | null => {
  const index = overviews.findIndex((overview) => overview.id === id);
  if (index !== -1) {
    overviews[index] = { ...overviews[index], ...updatedOverview };
    return overviews[index];
  }
  return null;
};

export const deleteMockOverviewById = (id: number): object | null => {
  const index = overviews.findIndex((overview) => overview.id === id);
  if (index !== -1) {
    const deletedOverview = overviews.splice(index, 1)[0];
    return deletedOverview;
  }
  return null;
};
