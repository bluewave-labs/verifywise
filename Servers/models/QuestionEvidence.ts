/**
 * Represents the evidence for a question in the system.
 *
 * @interface QuestionEvidence
 *
 * @property {number} id - The unique identifier for the question evidence.
 * @property {number} question_id - The identifier for the related question.
 * @property {number} section_id - The identifier for the related section.
 * @property {string} assessment_review - The assessment review text.
 * @property {string} evidence - The evidence text.
 */

export interface QuestionEvidence {
  id: number;
  question_id: number;
  section_id: number;
  assessment_review: string;
  evidence: string;
}
