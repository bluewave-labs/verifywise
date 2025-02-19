/*

This is the new Assessment model(Schema) and will be replaced with the new one.
Please align other files with this

In fact nothing specific has changedn but we're only 
changing "projectId" to "project_id" for more consistancy

*/
export type Assessment = {
  id?: number;
  project_id: number;
};

// export type Assessment = {
//   id: number;
//   projectId: number;
// };
