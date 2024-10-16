import { sections } from "../sections/sections.data";

export const getAllMockSections = (): Array<any> => {
  return sections;
};

export const getMockSectionById = (id: number): object | undefined => {
  return sections.find((section) => section.id === id);
};

export const createMockSection = (newSection: any): object => {
  sections.push(newSection);
  return newSection;
};

export const updateMockSectionById = (id: number, updatedSection: any): object | null => {
  const index = sections.findIndex((section) => section.id === id);
  if (index !== -1) {
    sections[index] = { ...sections[index], ...updatedSection };
    return sections[index];
  }
  return null;
};

export const deleteMockSectionById = (id: number): object | null => {
  const index = sections.findIndex((section) => section.id === id);
  if (index !== -1) {
    const deletedSection = sections.splice(index, 1)[0];
    return deletedSection;
  }
  return null;
};
