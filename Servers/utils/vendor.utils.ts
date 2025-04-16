import { Vendor, VendorModel } from "../models/vendor.model";
import { sequelize } from "../database/db";
import { deleteVendorRisksForVendorQuery } from "./vendorRisk.util";
import { VendorsProjectsModel } from "../models/vendorsProjects.model";
import { QueryTypes, Sequelize, Transaction } from "sequelize";
import { updateProjectUpdatedByIdQuery } from "./project.utils";

export const getAllVendorsQuery = async (): Promise<Vendor[]> => {
  const vendors = await sequelize.query(
    "SELECT * FROM vendors ORDER BY created_at DESC, id ASC",
    {
      mapToModel: true,
      model: VendorModel
    }
  );
  for (let vendor of (vendors as (VendorModel & { projects: number[] })[])) {
    const projects = await sequelize.query(
      "SELECT project_id FROM vendors_projects WHERE vendor_id = :vendor_id",
      {
        replacements: { vendor_id: vendor.id },
        mapToModel: true,
        model: VendorsProjectsModel
      }
    )
    vendor.dataValues["projects"] = projects.map(p => p.project_id)
  }
  return vendors
};

export const getVendorByIdQuery = async (
  id: number
): Promise<Vendor | null> => {
  const result = await sequelize.query(
    "SELECT * FROM vendors WHERE id = :id",
    {
      replacements: { id },
      mapToModel: true,
      model: VendorModel
    }
  );
  if (!result.length) return null;
  const projects = await sequelize.query(
    "SELECT project_id FROM vendors_projects WHERE vendor_id = :vendor_id",
    {
      replacements: { vendor_id: id },
      mapToModel: true,
      model: VendorsProjectsModel
    }
  )
  return { ...result[0].dataValues, projects: (projects || []).map(p => p.project_id) }
};

export const getVendorByProjectIdQuery = async (
  project_id: number
): Promise<Vendor[] | null> => {
  const result = await sequelize.query(
    "SELECT vendor_id FROM vendors_projects WHERE project_id = :project_id",
    {
      replacements: { project_id },
      mapToModel: true,
      model: VendorsProjectsModel
    }
  );
  if (!result.length) return null;
  const vendors: Vendor[] = []
  for (let vendors_project of (result || [])) {
    const vendor = await sequelize.query(
      "SELECT * FROM vendors WHERE id = :id ORDER BY created_at DESC, id ASC",
      {
        replacements: {
          id: vendors_project.vendor_id
        },
        mapToModel: true,
        model: VendorModel
      }
    );
    // commenting as, for the current functionality, project and vendor have 1:1 mapping
    // const projects = await sequelize.query("SELECT project_id FROM vendors_projects WHERE vendor_id = $1", [vendors_project.vendor_id])
    // vendors.push({ ...vendor[0], projects: projects.map(p => p.project_id) })
    vendors.push({ ...vendor[0].dataValues, projects: [project_id] })
  }
  return vendors
};

const addVendorProjects = async (vendorId: number, projects: number[], transaction: Transaction) => {
  let vendorsProjectFlat = []
  let placeholdersArray = []
  for (let project of projects) {
    vendorsProjectFlat.push(vendorId, project)
    placeholdersArray.push("(?, ?)")
  }
  let placeholders = placeholdersArray.join(", ")
  const query = `INSERT INTO vendors_projects (vendor_id, project_id) VALUES ${placeholders} RETURNING *`;
  const vendors_projects = await sequelize.query(query, {
    replacements: vendorsProjectFlat,
    mapToModel: true,
    model: VendorsProjectsModel,
    transaction
  });
  return vendors_projects
}

export const createNewVendorQuery = async (vendor: Vendor): Promise<Vendor | null> => {
  const transaction = await sequelize.transaction();
  try {
    const result = await sequelize.query(
      `INSERT INTO vendors (
        order_no, vendor_name, vendor_provides, assignee, website, vendor_contact_person,
        review_result, review_status, reviewer, risk_status, review_date
      ) VALUES (
        :order_no, :vendor_name, :vendor_provides, :assignee, :website, :vendor_contact_person,
        :review_result, :review_status, :reviewer, :risk_status, :review_date
      ) RETURNING *`,
      {
        replacements: {
          order_no: vendor.order_no || null,
          vendor_name: vendor.vendor_name,
          vendor_provides: vendor.vendor_provides,
          assignee: vendor.assignee,
          website: vendor.website,
          vendor_contact_person: vendor.vendor_contact_person,
          review_result: vendor.review_result,
          review_status: vendor.review_status,
          reviewer: vendor.reviewer,
          risk_status: vendor.risk_status,
          review_date: vendor.review_date
        },
        mapToModel: true,
        model: VendorModel,
        // type: QueryTypes.INSERT
        transaction
      }
    );

    if (!result || !result || result.length === 0) {
      console.error(" Error: Vendor insert query did not return any data.");
      return null;
    }

    const createdVendor = result[0] as (VendorModel & { projects: number[] })
    const vendorId = createdVendor.id!;

    createdVendor.dataValues["projects"] = []

    if (vendor.projects && vendor.projects.length > 0) {
      // let vendorsProjectFlat = []
      // let placeholdersArray = []
      // for (let project of vendor.projects) {
      //   vendorsProjectFlat.push(vendorId, project)
      //   placeholdersArray.push("(?, ?)")
      // }
      // let placeholders = placeholdersArray.join(", ")
      // const query = `INSERT INTO vendors_projects (vendor_id, project_id) VALUES ${placeholders} RETURNING *`;
      // const vendors_projects = await sequelize.query(query, {
      //   replacements: vendorsProjectFlat,
      //   mapToModel: true,
      //   model: VendorsProjectsModel,
      //   transaction
      // });
      const vendors_projects = await addVendorProjects(vendorId, vendor.projects, transaction)
      createdVendor.dataValues["projects"] = vendors_projects.map(p => p.project_id)
    }
    await transaction.commit();
    await updateProjectUpdatedByIdQuery(vendorId, "vendors");

    return createdVendor;
  } catch (error) {
    console.error(" Error in createNewVendorQuery:", error);
    return null;
  }
};

export const updateVendorByIdQuery = async (
  id: number,
  vendor: Partial<Vendor>
): Promise<Vendor | null> => {
  const transaction = await sequelize.transaction();
  try {
    const updateVendor: Partial<Record<keyof Vendor, any>> = {};
    const setClause = [
      "vendor_name",
      "vendor_provides",
      "assignee",
      "website",
      "vendor_contact_person",
      "review_result",
      "review_status",
      "reviewer",
      "risk_status",
      "review_date",
    ].filter(f => {
      if (vendor[f as keyof Vendor] !== undefined) {
        updateVendor[f as keyof Vendor] = vendor[f as keyof Vendor]
        return true
      }
    }).map(f => `${f} = :${f}`).join(", ");

    const query = `UPDATE vendors SET ${setClause} WHERE id = :id RETURNING *;`;

    updateVendor.id = id;

    const result = await sequelize.query(query, {
      replacements: updateVendor,
      mapToModel: true,
      model: VendorModel,
      // type: QueryTypes.UPDATE,
      transaction,
    });

    if (vendor.projects && vendor.projects.length > 0) {
      await sequelize.query(
        `DELETE FROM vendors_projects WHERE vendor_id = :id`,
        {
          replacements: { id },
          mapToModel: true,
          model: VendorsProjectsModel,
          type: QueryTypes.DELETE,
          transaction,
        }
      );

      const vendors_projects = await addVendorProjects(id, vendor.projects, transaction)
      result[0].dataValues["projects"] = vendors_projects.map(p => p.project_id)
    } else {
      const projects = await sequelize.query(
        "SELECT project_id FROM vendors_projects WHERE vendor_id = :vendor_id",
        {
          replacements: { vendor_id: id },
          mapToModel: true,
          model: VendorsProjectsModel
        }
      )
      result[0].dataValues["projects"] = projects.map(p => p.project_id)
    }
    await transaction.commit();
    await updateProjectUpdatedByIdQuery(id, "vendors");

    return result[0];
  } catch (error) {
    await transaction.rollback();
    console.error("Error in updateVendorByIdQuery:", error);
    return null;
  }
};

export const deleteVendorByIdQuery = async (id: number): Promise<Boolean> => {
  await deleteVendorRisksForVendorQuery(id);
  await updateProjectUpdatedByIdQuery(id, "vendors");
  await sequelize.query(
    `DELETE FROM vendors_projects WHERE vendor_id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: VendorsProjectsModel,
      type: QueryTypes.DELETE,
    }
  );
  const result = await sequelize.query(
    "DELETE FROM vendors WHERE id = :id RETURNING id",
    {
      replacements: { id },
      mapToModel: true,
      model: VendorModel,
      type: QueryTypes.DELETE,
    }
  );
  return result.length > 0;
};
