// Helper function to validate that an array contains only numbers
export const validateRiskArray = (riskArray: any[], arrayName: string): number[] => {
  if (!Array.isArray(riskArray)) {
    throw new Error(`${arrayName} must be an array`);
  }

  const validatedArray: number[] = [];

  for (let i = 0; i < riskArray.length; i++) {
    const item = riskArray[i];

    // Check if it's a number or a string that can be converted to a number
    if (typeof item === 'number' && !isNaN(item) && Number.isInteger(item)) {
      validatedArray.push(item);
    } else {
      throw new Error(`${arrayName}[${i}] contains invalid value: "${item}". All items must be valid integers.`);
    }
  }

  return validatedArray;
};
