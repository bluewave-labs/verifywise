import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  getEvidenceExportsQuery,
  createEvidenceExportQuery,
  getEventsQuery,
  getViolationsQuery,
} from "../utils/shadowAi.utils";

export async function getEvidenceExports(req: Request, res: Response): Promise<any> {
  try {
    const exports = await getEvidenceExportsQuery(req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](exports));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createEvidenceExport(req: Request, res: Response): Promise<any> {
  try {
    const data = req.body;
    if (!data.name || !data.date_range_start || !data.date_range_end) {
      return res.status(400).json(STATUS_CODE[400]("name, date_range_start, and date_range_end are required"));
    }

    // Collect evidence data
    const eventFilters = {
      start_date: data.date_range_start,
      end_date: data.date_range_end,
      ...(data.filters || {}),
      limit: 10000, // Max evidence export size
      page: 1,
    };

    const eventsResult = await getEventsQuery(eventFilters, req.tenantId!);
    const violationsResult = await getViolationsQuery(eventFilters, req.tenantId!);

    // Create the export record
    const exportRecord = await createEvidenceExportQuery(
      { ...data, generated_by: req.userId },
      req.tenantId!
    );

    // Return the evidence package data along with the record
    return res.status(201).json(STATUS_CODE[201]({
      export: exportRecord,
      evidence: {
        events: eventsResult,
        violations: violationsResult,
        generated_at: new Date().toISOString(),
        date_range: {
          start: data.date_range_start,
          end: data.date_range_end,
        },
      },
    }));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
