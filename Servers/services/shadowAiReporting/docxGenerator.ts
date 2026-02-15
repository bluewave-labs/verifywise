/**
 * Shadow AI DOCX Generator
 *
 * Native DOCX generation using the `docx` library.
 * Follows same pattern as Servers/services/reporting/docxGenerator.ts.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  PageBreak,
  BorderStyle,
  Footer,
  PageNumber,
  ShadingType,
  VerticalAlign,
  convertInchesToTwip,
} from "docx";
import { ShadowAIReportData } from "./dataCollector";
import { ReportGenerationResult } from "./pdfGenerator";

// ─── Color constants ─────────────────────────────────────────────────────

const COLORS = {
  primary: "13715B",
  secondary: "1C2130",
  textPrimary: "1C2130",
  textSecondary: "667085",
  textTertiary: "98A2B3",
  border: "E4E7EC",
  backgroundAlt: "F9FAFB",
  success: "027A48",
  warning: "B54708",
  error: "B42318",
};

// ─── Helpers ─────────────────────────────────────────────────────────────

function createSectionHeader(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 400, after: 300 },
    shading: { fill: COLORS.backgroundAlt, type: ShadingType.CLEAR },
    border: {
      left: {
        color: COLORS.primary,
        size: 24,
        style: BorderStyle.SINGLE,
        space: 8,
      },
    },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: 36,
        color: COLORS.textPrimary,
      }),
    ],
  });
}

function createSubsectionHeader(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 300, after: 200 },
    border: {
      bottom: {
        color: COLORS.border,
        size: 6,
        style: BorderStyle.SINGLE,
        space: 4,
      },
    },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 32,
        color: COLORS.textPrimary,
      }),
    ],
  });
}

function createTable(headers: string[], rows: string[][]): Table {
  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: COLORS.border,
  };

  const headerCells = headers.map(
    (header) =>
      new TableCell({
        shading: { fill: COLORS.backgroundAlt, type: ShadingType.CLEAR },
        borders: {
          top: borderStyle,
          bottom: borderStyle,
          left: borderStyle,
          right: borderStyle,
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: header,
                bold: true,
                size: 20,
                color: COLORS.textPrimary,
              }),
            ],
          }),
        ],
        verticalAlign: VerticalAlign.CENTER,
      })
  );

  const dataRows = rows.map(
    (row, rowIndex) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              shading:
                rowIndex % 2 === 1
                  ? { fill: COLORS.backgroundAlt, type: ShadingType.CLEAR }
                  : undefined,
              borders: {
                top: borderStyle,
                bottom: borderStyle,
                left: borderStyle,
                right: borderStyle,
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cell || "-",
                      size: 20,
                      color: COLORS.textPrimary,
                    }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            })
        ),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headerCells, tableHeader: true }),
      ...dataRows,
    ],
  });
}

function createTableSpacing(): Paragraph {
  return new Paragraph({ spacing: { after: 200 }, children: [] });
}

function createEmptyState(message: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    shading: { fill: COLORS.backgroundAlt, type: ShadingType.CLEAR },
    children: [
      new TextRun({
        text: message,
        size: 22,
        color: COLORS.textSecondary,
        italics: true,
      }),
    ],
  });
}

function createStatLine(label: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22 }),
      new TextRun({ text: value, size: 22 }),
    ],
  });
}

// ─── Cover Page ──────────────────────────────────────────────────────────

function createCoverPage(reportData: ShadowAIReportData): Paragraph[] {
  const { metadata, branding } = reportData;
  const paragraphs: Paragraph[] = [];

  paragraphs.push(new Paragraph({ spacing: { before: 2400 }, children: [] }));

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({
          text: branding.organizationName,
          bold: true,
          size: 64,
          color: COLORS.primary,
        }),
      ],
    })
  );

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "Shadow AI Report",
          bold: true,
          size: 64,
          color: COLORS.textPrimary,
        }),
      ],
    })
  );

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({
          text: `Period: ${metadata.period}`,
          size: 36,
          color: COLORS.textSecondary,
        }),
      ],
    })
  );

  paragraphs.push(new Paragraph({ spacing: { before: 800 }, children: [] }));

  const formattedDate = metadata.generatedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({ text: "Generated: ", bold: true, size: 28, color: COLORS.textPrimary }),
        new TextRun({ text: formattedDate, size: 28, color: COLORS.textPrimary }),
      ],
    })
  );

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({ text: "Prepared by: ", bold: true, size: 28, color: COLORS.textPrimary }),
        new TextRun({ text: metadata.generatedBy, size: 28, color: COLORS.textPrimary }),
      ],
    })
  );

  paragraphs.push(new Paragraph({ children: [new PageBreak()] }));

  return paragraphs;
}

// ─── TOC ─────────────────────────────────────────────────────────────────

function createTOC(reportData: ShadowAIReportData): Paragraph[] {
  const { sections } = reportData;
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: "Table of contents",
          bold: true,
          size: 48,
          color: COLORS.textPrimary,
        }),
      ],
    })
  );

  let sn = 1;
  const tocEntries = [
    ["executiveSummary", "Executive summary"],
    ["toolInventory", "Tool inventory"],
    ["riskAnalysis", "Risk analysis"],
    ["usageTrends", "Usage trends"],
    ["departmentBreakdown", "Department breakdown"],
    ["topUsers", "Top users"],
    ["compliancePosture", "Compliance posture"],
    ["alertActivity", "Alert & rule activity"],
  ];

  tocEntries.forEach(([key, label]) => {
    if (sections[key]) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 160, after: 160 },
          border: {
            bottom: { style: BorderStyle.DOTTED, size: 1, color: COLORS.border },
          },
          children: [
            new TextRun({
              text: `${sn++}. ${label}`,
              size: 24,
              color: COLORS.textPrimary,
            }),
          ],
        })
      );
    }
  });

  paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
  return paragraphs;
}

// ─── Sections ────────────────────────────────────────────────────────────

function createExecutiveSummary(data: any): (Paragraph | Table)[] {
  if (!data) return [];
  const elements: (Paragraph | Table)[] = [];
  elements.push(createSectionHeader("Executive summary"));
  elements.push(createStatLine("AI tools detected", String(data.uniqueApps)));
  elements.push(createStatLine("Active users", String(data.totalUsers)));
  elements.push(createStatLine("Departments", String(data.departments)));
  if (data.highestRiskTool) {
    elements.push(
      createStatLine(
        "Highest risk tool",
        `${data.highestRiskTool.name} (score: ${data.highestRiskTool.risk_score})`
      )
    );
  }
  if (data.mostActiveDepartment) {
    elements.push(
      createStatLine("Most active department", data.mostActiveDepartment)
    );
  }
  return elements;
}

function createToolInventorySection(data: any): (Paragraph | Table)[] {
  if (!data) return [];
  const elements: (Paragraph | Table)[] = [];
  elements.push(createSectionHeader("Tool inventory"));

  if (data.tools.length > 0) {
    const headers = ["Tool", "Vendor", "Status", "Risk Score", "Users", "Events"];
    const rows = data.tools.map((t: any) => [
      t.name,
      t.vendor,
      t.status,
      String(t.riskScore),
      String(t.totalUsers),
      String(t.totalEvents),
    ]);
    elements.push(createTable(headers, rows));
    elements.push(createTableSpacing());
  } else {
    elements.push(createEmptyState("No AI tools have been detected yet."));
  }

  return elements;
}

function createRiskAnalysisSection(data: any): (Paragraph | Table)[] {
  if (!data) return [];
  const elements: (Paragraph | Table)[] = [];
  elements.push(createSectionHeader("Risk analysis"));

  if (data.toolsByRisk.length > 0) {
    const headers = ["Tool", "Risk Score", "Status"];
    const rows = data.toolsByRisk.map((t: any) => [
      t.name,
      String(t.riskScore),
      t.status,
    ]);
    elements.push(createTable(headers, rows));
    elements.push(createTableSpacing());
  } else {
    elements.push(createEmptyState("No tools with risk scores found."));
  }

  return elements;
}

function createUsageTrendsSection(data: any): (Paragraph | Table)[] {
  if (!data) return [];
  const elements: (Paragraph | Table)[] = [];
  elements.push(createSectionHeader("Usage trends"));

  if (data.periodSummary) {
    elements.push(
      createStatLine(
        "Total events",
        data.periodSummary.totalEvents.toLocaleString()
      )
    );
    elements.push(
      createStatLine(
        "Average per period",
        String(data.periodSummary.avgDailyEvents)
      )
    );
    elements.push(
      createStatLine(
        "Peak",
        `${data.periodSummary.peakEvents} (${data.periodSummary.peakDay})`
      )
    );
  }

  if (data.dataPoints.length > 0) {
    const headers = ["Date", "Events", "Users", "New Tools"];
    const rows = data.dataPoints.map((p: any) => [
      p.date,
      String(p.totalEvents),
      String(p.uniqueUsers),
      String(p.newTools),
    ]);
    elements.push(createTable(headers, rows));
    elements.push(createTableSpacing());
  }

  return elements;
}

function createDepartmentSection(data: any): (Paragraph | Table)[] {
  if (!data) return [];
  const elements: (Paragraph | Table)[] = [];
  elements.push(createSectionHeader("Department breakdown"));

  if (data.departments.length > 0) {
    const headers = ["Department", "Users", "Prompts", "Top Tool", "Max Risk"];
    const rows = data.departments.map((d: any) => [
      d.name,
      String(d.users),
      String(d.prompts),
      d.topTool,
      String(d.maxRisk),
    ]);
    elements.push(createTable(headers, rows));
    elements.push(createTableSpacing());
  } else {
    elements.push(createEmptyState("No department data available."));
  }

  return elements;
}

function createTopUsersSection(data: any): (Paragraph | Table)[] {
  if (!data) return [];
  const elements: (Paragraph | Table)[] = [];
  elements.push(createSectionHeader("Top users"));

  if (data.users.length > 0) {
    const headers = ["Email", "Prompts", "Department", "Risk Score"];
    const rows = data.users.map((u: any) => [
      u.email,
      String(u.prompts),
      u.department,
      String(u.riskScore),
    ]);
    elements.push(createTable(headers, rows));
    elements.push(createTableSpacing());
  } else {
    elements.push(createEmptyState("No user activity data available."));
  }

  return elements;
}

function createComplianceSection(data: any): (Paragraph | Table)[] {
  if (!data) return [];
  const elements: (Paragraph | Table)[] = [];
  elements.push(createSectionHeader("Compliance posture"));

  elements.push(createStatLine("Approved tools", String(data.compliant)));
  elements.push(
    createStatLine("Blocked / restricted", String(data.nonCompliant))
  );
  elements.push(createStatLine("Total tools", String(data.total)));

  if (data.byStatus.length > 0) {
    const headers = ["Status", "Count"];
    const rows = data.byStatus.map((s: any) => [s.status, String(s.count)]);
    elements.push(createTable(headers, rows));
    elements.push(createTableSpacing());
  }

  return elements;
}

function createAlertActivitySection(data: any): (Paragraph | Table)[] {
  if (!data) return [];
  const elements: (Paragraph | Table)[] = [];
  elements.push(createSectionHeader("Alert & rule activity"));

  elements.push(createSubsectionHeader("Rules"));
  if (data.rules.length > 0) {
    const headers = ["Rule Name", "Trigger Type", "Active", "Times Fired"];
    const rows = data.rules.map((r: any) => [
      r.name,
      r.triggerType,
      r.isActive ? "Yes" : "No",
      String(r.fireCount),
    ]);
    elements.push(createTable(headers, rows));
    elements.push(createTableSpacing());
  } else {
    elements.push(createEmptyState("No rules have been configured."));
  }

  elements.push(createSubsectionHeader("Recent alerts"));
  if (data.recentAlerts.length > 0) {
    const headers = ["Rule", "Fired At", "Details"];
    const rows = data.recentAlerts.map((a: any) => [
      a.ruleName,
      a.firedAt,
      a.details,
    ]);
    elements.push(createTable(headers, rows));
    elements.push(createTableSpacing());
  } else {
    elements.push(createEmptyState("No alerts have been triggered."));
  }

  return elements;
}

// ─── Footer ──────────────────────────────────────────────────────────────

function createFooter(reportData: ShadowAIReportData): Footer {
  const formattedDate = reportData.metadata.generatedAt.toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: {
          top: {
            color: COLORS.border,
            size: 6,
            style: BorderStyle.SINGLE,
            space: 4,
          },
        },
        children: [
          new TextRun({
            text: `${reportData.branding.organizationName} | Shadow AI Report | Generated: ${formattedDate} | Page `,
            size: 18,
            color: COLORS.textTertiary,
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 18,
            color: COLORS.textTertiary,
          }),
        ],
      }),
    ],
  });
}

// ─── Main Generator ──────────────────────────────────────────────────────

export async function generateShadowAIDOCX(
  reportData: ShadowAIReportData
): Promise<ReportGenerationResult> {
  try {
    const { sections } = reportData;

    const allChildren: (Paragraph | Table)[] = [
      ...createCoverPage(reportData),
      ...createTOC(reportData),
    ];

    if (sections.executiveSummary) {
      allChildren.push(...createExecutiveSummary(sections.executiveSummary));
    }
    if (sections.toolInventory) {
      allChildren.push(...createToolInventorySection(sections.toolInventory));
    }
    if (sections.riskAnalysis) {
      allChildren.push(...createRiskAnalysisSection(sections.riskAnalysis));
    }
    if (sections.usageTrends) {
      allChildren.push(...createUsageTrendsSection(sections.usageTrends));
    }
    if (sections.departmentBreakdown) {
      allChildren.push(...createDepartmentSection(sections.departmentBreakdown));
    }
    if (sections.topUsers) {
      allChildren.push(...createTopUsersSection(sections.topUsers));
    }
    if (sections.compliancePosture) {
      allChildren.push(...createComplianceSection(sections.compliancePosture));
    }
    if (sections.alertActivity) {
      allChildren.push(...createAlertActivitySection(sections.alertActivity));
    }

    const doc = new Document({
      styles: {
        default: {
          document: { run: { font: "Arial", size: 22 } },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                right: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1),
              },
            },
          },
          footers: { default: createFooter(reportData) },
          children: allChildren,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const filename = `ShadowAI_Report_${timestamp}.docx`;

    return {
      success: true,
      filename,
      content: buffer,
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  } catch (error) {
    console.error("[ShadowAI DOCX] Error generating DOCX:", error);
    return {
      success: false,
      filename: "",
      content: Buffer.alloc(0),
      mimeType: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
