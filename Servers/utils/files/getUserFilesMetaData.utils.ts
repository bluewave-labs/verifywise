import { sequelize } from "../../database/db";
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

      switch (result.source) {
        case "Annex controls group": {
          const annexControlQuery = `
          SELECT ac.id AS annex_control_id, acs.annex_id as annex_id
          FROM "${tenant}".annexcontrols_iso27001 ac
          JOIN public.annexcontrols_struct_iso27001 acs ON acs.id = ac.annexcontrol_meta_id
          WHERE ac.evidence_links @> jsonb_build_array(jsonb_build_object('id', :fileId::text));`;
          let annexControlResult = (await sequelize.query(annexControlQuery, {
            replacements: { fileId: result.id },
          })) as [any[], number];

          let annexControl = annexControlResult[0][0];
          if (annexControl) {
            result.meta_id = annexControl.annex_control_id;
            result.parent_id = annexControl.annex_id;
          }
          break;
        }
        case "Compliance tracker group": {
          const subControlQuery = `SELECT s.id as meta_id, s.evidence_files as evidences, c.control_meta_id as parent_id FROM "${tenant}".subcontrols_eu s 
          JOIN "${tenant}".controls_eu c ON s.control_id = c.id
          WHERE (
            s.evidence_files @> jsonb_build_array(jsonb_build_object('id', :fileId::text))
            OR s.feedback_files @> jsonb_build_array(jsonb_build_object('id', :fileId::text))
          )
          LIMIT 1;`;
          let subControlResult = (await sequelize.query(subControlQuery, {
            replacements: { fileId: result.id },
          })) as [any[], number];

          let subControl = subControlResult[0][0];
          if (subControl) {
            result.is_evidence = subControl.evidences?.some(
              (file: any) => Number(file.id) === Number(result.id),
            );
            result.parent_id = subControl.parent_id;
            result.meta_id = subControl.meta_id;
          }
          break;
        }
        case "Assessment tracker group": {
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
            result.meta_id = assessment.question_id;
            result.sub_id = assessment.subtopic_id;
            result.parent_id = assessment.topic_id;
          }
          break;
        }
        case "Reference controls group": {
          const referenceControlQuery = `
          SELECT ac.id AS annex_category_id, acs.annex_id as annex_id
          FROM "${tenant}".annexcategories_iso ac
          JOIN public.annexcategories_struct_iso acs ON acs.id = ac.annexcategory_meta_id
          WHERE ac.evidence_links @> jsonb_build_array(jsonb_build_object('id', :fileId::text));`;
          let referenceControlResult = (await sequelize.query(
            referenceControlQuery,
            {
              replacements: { fileId: result.id },
            },
          )) as [any[], number];

          let referenceControl = referenceControlResult[0][0];
          if (referenceControl) {
            result.meta_id = referenceControl.annex_category_id;
            result.parent_id = referenceControl.annex_id;
          }
          break;
        }
        case "Main clauses group": {
          const mainClauseQuery = `
          SELECT sc.id AS sub_clause_id, scs.clause_id as clause_id
          FROM "${tenant}".subclauses_iso27001 sc
          JOIN public.subclauses_struct_iso27001 scs ON scs.id = sc.subclause_meta_id
          WHERE sc.evidence_links @> jsonb_build_array(jsonb_build_object('id', :fileId::text));`;
          let mainClauseResult = (await sequelize.query(mainClauseQuery, {
            replacements: { fileId: result.id },
          })) as [any[], number];

          let mainClause = mainClauseResult[0][0];
          if (mainClause) {
            result.meta_id = mainClause.sub_clause_id;
            result.parent_id = mainClause.clause_id;
          }
          break;
        }
        case "Management system clauses group": {
          const subClauseQuery = `
        SELECT sc.id AS sub_clause_id, scs.clause_id as clause_id
        FROM "${tenant}".subclauses_iso sc
        JOIN public.subclauses_struct_iso scs ON scs.id = sc.subclause_meta_id
        WHERE sc.evidence_links @> jsonb_build_array(jsonb_build_object('id', :fileId::text));`;
          let subClauseResult = (await sequelize.query(subClauseQuery, {
            replacements: { fileId: result.id },
          })) as [any[], number];

          let subClause = subClauseResult[0][0];
          if (subClause) {
            result.meta_id = subClause.sub_clause_id;
            result.parent_id = subClause.clause_id;
          }
          break;
        }
        default:
          result.is_evidence = true;
          console.error(`Unknown source type: ${result.source}`);
          break;
      }
    }
    return results;
  } catch (err) {
    console.error(`Database query failed for user ${userId}:`, err);
    throw new Error("Failed to retrieve file metadata.");
  }
};

export default getUserFilesMetaDataQuery;
