import { ControlCategories } from "../controlCategory.mock.data";
import { ControlCategory } from "../../models/controlCategory.model";

export const getAllMockControlCategories = (): Array<any> => {
  return ControlCategories;
};

export const getMockControlCategoryById = (id: number): object | undefined => {
  return ControlCategories.find(
    (controlCategory: ControlCategory) => controlCategory.id === id
  );
};

export const createMockControlCategory = (newControlCategory: any): object => {
  ControlCategories.push(newControlCategory);
  return newControlCategory;
};

export const updateMockControlCategoryById = (
  id: number,
  updatedControlCategory: any
): object | null => {
  const index = ControlCategories.findIndex(
    (controlCategory: ControlCategory) => controlCategory.id === id
  );
  if (index !== -1) {
    ControlCategories[index] = {
      ...ControlCategories[index],
      ...updatedControlCategory,
    };
    return ControlCategories[index];
  }
  return null;
};

export const deleteMockControlCategoryById = (id: number): object | null => {
  const index = ControlCategories.findIndex(
    (controlCategory: ControlCategory) => controlCategory.id === id
  );
  if (index !== -1) {
    const deletedControlCategory = ControlCategories.splice(index, 1)[0];
    return deletedControlCategory;
  }
  return null;
};
