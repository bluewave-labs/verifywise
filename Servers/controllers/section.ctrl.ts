import { Request, Response } from "express";
const MOCK_DATA_ON = process.env.MOCK_DATA_ON;

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockSection,
  deleteMockSectionById,
  getAllMockSections,
  getMockSectionById,
  updateMockSectionById
} from "../mocks/tools/section.mock.db"
import {
  createNewSectionQuery,
  deleteSectionByIdQuery,
  getAllSectionsQuery,
  getSectionByIdQuery,
  updateSectionByIdQuery
} from "../utils/section.util";

export async function getAllSections(req: Request, res: Response): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const sections = getAllMockSections();

      if (sections) {
        return res.status(200).json(STATUS_CODE[200](sections));
      }

      return res.status(204).json(STATUS_CODE[204](sections));
    } else {
      const sections = await getAllSectionsQuery();

      if (sections) {
        return res.status(200).json(STATUS_CODE[200](sections));
      }

      return res.status(204).json(STATUS_CODE[204](sections));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getSectionById(req: Request, res: Response): Promise<any> {
  try {
    const sectionId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const section = getMockSectionById(sectionId);

      if (section) {
        return res.status(200).json(STATUS_CODE[200](section));
      }

      return res.status(404).json(STATUS_CODE[404](section));
    } else {
      const section = await getSectionByIdQuery(sectionId);

      if (section) {
        return res.status(200).json(STATUS_CODE[200](section));
      }

      return res.status(404).json(STATUS_CODE[404](section));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createSection(req: Request, res: Response): Promise<any> {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "name and description are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const newSection = createMockSection({ name, description });

      if (newSection) {
        return res.status(201).json(STATUS_CODE[201](newSection));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    } else {
      const newSection = await createNewSectionQuery({ name, description });

      if (newSection) {
        return res.status(201).json(STATUS_CODE[201](newSection));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateSectionById(
  req: Request,
  res: Response
): Promise<any> {
  console.log("updateSectionById");
  try {
    const sectionId = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "name and description are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const updatedSection = updateMockSectionById(sectionId, { name, description });

      if (updatedSection) {
        return res.status(202).json(STATUS_CODE[202](updatedSection));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const updatedSection = await updateSectionByIdQuery(sectionId, {
        name,
        description,
      });

      if (updatedSection) {
        return res.status(202).json(STATUS_CODE[202](updatedSection));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteSectionById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const sectionId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const deletedSection = deleteMockSectionById(sectionId);

      if (deletedSection) {
        return res.status(202).json(STATUS_CODE[202](deletedSection));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const deletedSection = await deleteSectionByIdQuery(sectionId);

      if (deletedSection) {
        return res.status(202).json(STATUS_CODE[202](deletedSection));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
