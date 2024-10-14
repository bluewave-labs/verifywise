import { Request, Response } from "express";
const MOCK_DATA_ON = process.env.MOCK_DATA_ON;

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockVendor,
  deleteMockVendorById,
  getAllMockVendors,
  getMockVendorById,
  updateMockVendorById
} from "../mocks/tools/vendor.mock.db"
import {
  createNewVendorQuery,
  deleteVendorByIdQuery,
  getAllVendorsQuery,
  getVendorByIdQuery,
  updateVendorByIdQuery
} from "../utils/vendor.utils";

export async function getAllVendors(req: Request, res: Response): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const vendors = getAllMockVendors();

      if (vendors) {
        return res.status(200).json(STATUS_CODE[200](vendors));
      }

      return res.status(204).json(STATUS_CODE[204](vendors));
    } else {
      const vendors = await getAllVendorsQuery();

      if (vendors) {
        return res.status(200).json(STATUS_CODE[200](vendors));
      }

      return res.status(204).json(STATUS_CODE[204](vendors));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getVendorById(req: Request, res: Response): Promise<any> {
  try {
    const vendorId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const vendor = getMockVendorById(vendorId);

      if (vendor) {
        return res.status(200).json(STATUS_CODE[200](vendor));
      }

      return res.status(404).json(STATUS_CODE[404](vendor));
    } else {
      const vendor = await getVendorByIdQuery(vendorId);

      if (vendor) {
        return res.status(200).json(STATUS_CODE[200](vendor));
      }

      return res.status(404).json(STATUS_CODE[404](vendor));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createVendor(req: Request, res: Response): Promise<any> {
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
      const newVendor = createMockVendor({ name, description });

      if (newVendor) {
        return res.status(201).json(STATUS_CODE[201](newVendor));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    } else {
      const newVendor = await createNewVendorQuery({ name, description });

      if (newVendor) {
        return res.status(201).json(STATUS_CODE[201](newVendor));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateVendorById(
  req: Request,
  res: Response
): Promise<any> {
  console.log("updateVendorById");
  try {
    const vendorId = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "name and description are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const updatedVendor = updateMockVendorById(vendorId, { name, description });

      if (updatedVendor) {
        return res.status(202).json(STATUS_CODE[202](updatedVendor));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const updatedVendor = await updateVendorByIdQuery(vendorId, {
        name,
        description,
      });

      if (updatedVendor) {
        return res.status(202).json(STATUS_CODE[202](updatedVendor));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteVendorById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const vendorId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const deletedVendor = deleteMockVendorById(vendorId);

      if (deletedVendor) {
        return res.status(202).json(STATUS_CODE[202](deletedVendor));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const deletedVendor = await deleteVendorByIdQuery(vendorId);

      if (deletedVendor) {
        return res.status(202).json(STATUS_CODE[202](deletedVendor));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
