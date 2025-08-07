import { TrainingRegistarModel } from "../domain.layer/models/trainingRegistar/trainingRegistar.model";
import { sequelize } from "../database/db";
import { QueryTypes, Sequelize, Transaction } from "sequelize";
import { ITrainingRegister } from "../domain.layer/interfaces/i.trainingRegister";

/**
 *
 * Create a Training Registar
 */
export const createNewTrainingRegistarQuery = async (
  trainingRegistar: TrainingRegistarModel,
  tenant: string,
  transaction: Transaction
) => {
  const result = await sequelize.query(
    `INSERT INTO "${tenant}".trainingregistar (
            training_name, duration, provider, department, status, people, description
        ) VALUES (
            :training_name, :duration, :provider, :department, :status, :people, :description
        ) RETURNING *`,
    {
      replacements: {
        training_name: trainingRegistar.training_name,
        duration: trainingRegistar.duration,
        provider: trainingRegistar.provider,
        department: trainingRegistar.department,
        status: trainingRegistar.status,
        people: trainingRegistar.numberOfPeople,
        description: trainingRegistar.description,
      },
      mapToModel: true,
      model: TrainingRegistarModel,
      transaction,
    }
  );
  // Return the created TrainingRegistar instance
  return Array.isArray(result);
};

/**
 *
 * @returns All the training registars in the DB
 */

export const getAllTrainingRegistarQuery = async (
  tenant: string
): Promise<ITrainingRegister[]> => {
  const trainingRegistars = await sequelize.query(
    `SELECT * FROM "${tenant}".trainingregistar ORDER BY id ASC`,
    {
      mapToModel: true,
      model: TrainingRegistarModel,
    }
  );
  // Return all training registars or an empty array if none found
  return Array.isArray(trainingRegistars)
    ? (trainingRegistars as TrainingRegistarModel[])
    : [];
};

/**
 * Return the training registars by ID // for now keeping it might not need it eventually
 */
export const getTrainingRegistarByIdQuery = async (
  id: number,
  tenant: string
): Promise<ITrainingRegister> => {
  const trainingRegistarsById = await sequelize.query(
    `SELECT * FROM "${tenant}".trainingregistar WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: TrainingRegistarModel,
    }
  );
  // Return the first training registar or null if none found
  return Array.isArray(trainingRegistarsById) &&
    trainingRegistarsById.length > 0
    ? (trainingRegistarsById[0] as ITrainingRegister)
    : (null as any);
};

/**
 * Update all the training registars by ID
 */
export const updateTrainingRegistarByIdQuery = async (
  id: number,
  trainingRegistar: Partial<TrainingRegistarModel>,
  tenant: string,
  transaction: Transaction
): Promise<TrainingRegistarModel> => {
  const updateTrainingRegistar: Partial<
    Record<keyof TrainingRegistarModel, any> & { people?: number }
  > = {};
  const setClause = [
    "training_name",
    "duration",
    "provider",
    "department",
    "status",
    "people",
    "description",
  ]
    .filter((f) => {
      if (f === "people") {
        // Handle the people field mapping from numberOfPeople
        if (
          trainingRegistar.numberOfPeople !== undefined &&
          trainingRegistar.numberOfPeople !== null
        ) {
          updateTrainingRegistar.people = trainingRegistar.numberOfPeople;
          return true;
        }
      } else if (
        trainingRegistar[f as keyof TrainingRegistarModel] !== undefined &&
        trainingRegistar[f as keyof TrainingRegistarModel] !== null
      ) {
        updateTrainingRegistar[f as keyof TrainingRegistarModel] =
          trainingRegistar[f as keyof TrainingRegistarModel];
        return true;
      }
      return false;
    })
    .map((f) => `${f} = :${f}`)
    .join(", ");

  const query = `UPDATE "${tenant}".trainingregistar SET ${setClause} WHERE id = :id RETURNING *;`;
  updateTrainingRegistar.id = id;

  const result = await sequelize.query(query, {
    replacements: updateTrainingRegistar,
    mapToModel: true,
    model: TrainingRegistarModel,
    // type: QueryTypes.UPDATE,
    transaction,
  });

  // Return the first updated training registar or null if none found
  return Array.isArray(result) && result.length > 0
    ? (result[0] as TrainingRegistarModel)
    : (null as any);
};

/**
 * Delete training Registar by ID
 */

export const deleteTrainingRegistarByIdQuery = async (
  id: number,
  tenant: string,
  transaction: Transaction
): Promise<Boolean> => {
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".trainingregistar WHERE id = :id RETURNING id`,
    {
      replacements: { id },
      mapToModel: true,
      model: TrainingRegistarModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );

  // Check if any rows were affected
  return Array.isArray(result) && result.length > 0;
};
