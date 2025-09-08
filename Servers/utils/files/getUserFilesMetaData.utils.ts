import { sequelize } from "../../database/db";
import { SubcontrolEUModel } from "../../domain.layer/frameworks/EU-AI-Act/subControlEU.model";
import { FileList } from "../../domain.layer/models/file/file.model";

const getUserFilesMetaDataQuery = async (
  role: string,
  userId: number,
  tenant: string,
  options?: { limit?: number; offset?: number },
): Promise<FileList[]> => {
  const { limit, offset } = options ?? {}; // Default to empty object

  const paginationClause =
    limit !== undefined && offset !== undefined
      ? "LIMIT :limit OFFSET :offset"
      : limit !== undefined
        ? "LIMIT :limit"
        : "";

  let query = null;
  const replacements: Record<string, number> = {};

  if (role === "Admin") {
    query = `
      SELECT f.id, f.filename, f.project_id, f.uploaded_time, f.source, 
        p.project_title, u.name AS uploader_name, u.surname AS uploader_surname
      FROM "${tenant}".files f JOIN "${tenant}".projects p ON p.id = f.project_id
      JOIN public.users u ON f.uploaded_by = u.id
      WHERE f.source::TEXT NOT ILIKE '%report%'
      ORDER BY f.uploaded_time DESC
      ${paginationClause};
    `;
  } else {
    query = `
      WITH projects_of_user AS (
        SELECT DISTINCT project_id FROM "${tenant}".projects_members WHERE user_id = :userId
        UNION ALL
        SELECT id AS project_id FROM "${tenant}".projects WHERE owner = :userId
      ) SELECT f.id, f.filename, f.project_id, f.uploaded_time, f.source, 
          p.project_title, u.name AS uploader_name, u.surname AS uploader_surname
        FROM "${tenant}".files f JOIN projects_of_user pu ON f.project_id = pu.project_id
        JOIN "${tenant}".projects p ON p.id = pu.project_id
        JOIN public.users u ON f.uploaded_by = u.id
        WHERE f.source::TEXT NOT ILIKE '%report%'
        ORDER BY f.uploaded_time DESC
      ${paginationClause};`;
    replacements.userId = userId;
  }

  if (limit !== undefined) replacements.limit = limit;
  if (offset !== undefined) replacements.offset = offset;

  try {
    const queryResults = (await sequelize.query(query, {
      replacements,
    })) as [FileList[], number];

    const results = queryResults[0];
    for (let result of results) {
      result.sub_id = undefined;
      result.meta_id = undefined;
      result.parent_id = undefined;

      if (result.source === "Assessment tracker group") {
        const assessmentQuery = `SELECT ans.question_id AS question_id, topic.id AS topic_id, subtopic.id AS subtopic_id,
        question.id AS parent_id
        FROM "${tenant}".answers_eu ans
        JOIN public.questions_struct_eu question ON question.id = ans.question_id
        JOIN public.subtopics_struct_eu subtopic ON subtopic.id = question.subtopic_id
        JOIN public.topics_struct_eu topic ON topic.id = subtopic.topic_id
        WHERE ans.evidence_files @> jsonb_build_array(jsonb_build_object('id', :fileId::text));`;
        let assessmentResult = (await sequelize.query(assessmentQuery, {
          replacements: { fileId: result.id },
        })) as [any[], number];
        let assessment = assessmentResult[0][0];
        if (assessment) {
          console.log("Assessment query result:", assessment);
          result.meta_id = assessment.question_id;
          result.sub_id = assessment.subtopic_id;
          result.parent_id = assessment.topic_id;
        }
      }

      if (result.source === "Compliance tracker group") {
        const subControlQuery = `SELECT s.* FROM "${tenant}".subcontrols_eu s
        WHERE (
          s.evidence_files @> jsonb_build_array(jsonb_build_object('id', :fileId::text))
          OR s.feedback_files @> jsonb_build_array(jsonb_build_object('id', :fileId::text))
        )
        LIMIT 1;`;
        let subControlResult = (await sequelize.query(subControlQuery, {
          replacements: { fileId: result.id },
        })) as [SubcontrolEUModel[], number];

        let subControl = subControlResult[0][0];
        if (subControl) {
          result.is_evidence = subControl.evidence_files?.some(
            (file: any) => Number(file.id) === Number(result.id),
          );
          result.parent_id = subControl.control_id;
          result.meta_id = subControl.subcontrol_meta_id;
        }
      }
    }
    return results;
  } catch (err) {
    console.error(`Database query failed for user ${userId}:`, err);
    throw new Error("Failed to retrieve file metadata.");
  }
};

export default getUserFilesMetaDataQuery;
