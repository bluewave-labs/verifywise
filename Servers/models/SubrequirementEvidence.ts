/**
 * Represents the evidence for a subrequirement in the system.
 *
 * @interface SubrequirementEvidence
 *
 * @property {number} id - The unique identifier for the subrequirement evidence.
 * @property {number} subrequirement_id - The identifier for the related subrequirement.
 * @property {string} document_name - The name of the document.
 * @property {string} document_type - The type of the document.
 * @property {string} file_path - The file path where the document is stored.
 * @property {Date} upload_date - The date and time when the document was uploaded.
 * @property {number} uploader_id - The identifier for the user who uploaded the document.
 * @property {string} description - The description of the document.
 * @property {string} status - The status of the document.
 * @property {Date} last_reviewed - The date and time when the document was last reviewed.
 * @property {number} reviewer_id - The identifier for the user who reviewed the document.
 * @property {string} reviewer_comments - The comments from the reviewer.
 */

export interface SubrequirementEvidence {
  id: number;
  subrequirement_id: number;
  document_name: string;
  document_type: string;
  file_path: string;
  upload_date: Date;
  uploader_id: number;
  description: string;
  status: string;
  last_reviewed: Date;
  reviewer_id: number;
  reviewer_comments: string;
}
