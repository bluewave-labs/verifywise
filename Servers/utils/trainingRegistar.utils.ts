import {
  TrainingRegistar,
  TrainingRegistarModel,
} from "../domain.layer/models/trainingRegistar/trainingRegistar.model";
import { sequelize } from "../database/db";
import { QueryTypes, Sequelize, Transaction } from "sequelize";

/**
 *
 * Create a Training Registar
 */
export const createNewTrainingRegistarQuery = async (
  trainingRegistar: TrainingRegistar,
  transaction: Transaction
) => {
  const result = await sequelize.query(
    `INSERT INTO trainingregistar (
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

export const getAllTrainingRegistarQuery = async (): Promise<
  TrainingRegistar[]
> => {
  const trainingRegistars = await sequelize.query(
    "SELECT * FROM trainingregistar ORDER BY id ASC",
    {
      mapToModel: true,
      model: TrainingRegistarModel,
    }
  );
  // Return all training registars or an empty array if none found
  return Array.isArray(trainingRegistars)
    ? (trainingRegistars as TrainingRegistar[])
    : [];
};

/**
 * Return the training registars by ID // for now keeping it might not need it eventually
 */
export const getTrainingRegistarByIdQuery = async (
  id: number
): Promise<TrainingRegistar> => {
  const trainingRegistarsById = await sequelize.query(
    "SELECT * FROM trainingregistar WHERE id = :id",
    {
      replacements: { id },
      mapToModel: true,
      model: TrainingRegistarModel,
    }
  );
  // Return the first training registar or null if none found
  return Array.isArray(trainingRegistarsById) &&
    trainingRegistarsById.length > 0
    ? (trainingRegistarsById[0] as TrainingRegistar)
    : (null as any);
};

/**
 * Update all the training registars by ID
 */
export const updateTrainingRegistarByIdQuery = async (
  id: number,
  trainingRegistar: Partial<TrainingRegistar>,
  transaction: Transaction
): Promise<TrainingRegistar> => {
  const updateTrainingRegistar: Partial<Record<keyof TrainingRegistar, any>> =
    {};
  const setClause = [
    "training_name",
    "duration",
    "provider",
    "department",
    "status",
    "numberOfPeople",
    "description",
  ]
    .filter((f) => {
      if (
        trainingRegistar[f as keyof TrainingRegistar] !== undefined &&
        trainingRegistar[f as keyof TrainingRegistar]
      ) {
        updateTrainingRegistar[f as keyof TrainingRegistar] =
          trainingRegistar[f as keyof TrainingRegistar];
        return true;
      }
    })
    .map((f) => `${f} = :${f}`)
    .join(", ");

  const query = `UPDATE trainingregistar SET ${setClause} WHERE id = :id RETURNING *;`;
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
    ? (result[0] as TrainingRegistar)
    : (null as any);
};

/**
 * Delete training Registar by ID
 */

export const deleteTrainingRegistarByIdQuery = async (
  id: number,
  transaction: Transaction
): Promise<Boolean> => {
  const result = await sequelize.query(
    `DELETE FROM trainingregistar WHERE id = :id RETURNING id`,
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
