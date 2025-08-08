import {Column, DataType, Model, Table } from "sequelize-typescript";
import { IModelInventory } from "../../interfaces/i.modelInventory";
import { numberValidation } from "../../validations/number.valid";
import { ValidationException,
    BusinessLogicException,
    NotFoundException
 } from "../../exceptions/custom.exception";
import { ValidationError } from "sequelize";

 @Table({
    tableName:"modelinventory",
 })

 export class ModelInventory
   extends Model<ModelInventory>
   implements IModelInventory
   {
    @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    })
    id?: number;

    @Column({
        type: DataType.STRING,
    })
    model!: string;

    @Column({
        type: DataType.STRING
    })
    version!: string;

    @Column({
        type: DataType.STRING
    })
    approver!: string;

    @Column({
        type: DataType.ENUM("Vision","Caching","Tools","Code","Multimodal","Audio","Video")
    })
    capabilities!: "Vision"|"Caching"|"Tools"|"Code"| "Multimodal"|"Audio"|"Video";

    @Column({
        type: DataType.ENUM("Yes","No")
    })
    security_assessments!: "Yes" | "No";

    @Column({
    type: DataType.ENUM("Approved", "Pending", "Restricted", "Blocked"),
    })
    status!: "Approved" | "Pending" | "Restricted" | "Blocked";

    @Column({
        type:DataType.DATE,
    })
    status_date!: Date;

    /**
     * Create a new model inventory with validation
     */
    static async createNewModelInventory(
        model: string,
        version: string,
        approver: string,
        capabilities: "Vision" | "Caching" | "Tools" | "Code" | "Multimodal" | "Audio" | "Video",
        security_assessments: "Yes" | "No",
        status: "Approved" | "Pending" | "Restricted" | "Blocked",
        status_date: Date
    ): Promise<ModelInventory>{

        /**
         * Validate Required fields
         */
        if(!model || model.trim().length === 0){
            throw new ValidationException(
                "Model name is required",
                "model",
                model
            );
        }

        // Version is optional

        if(!approver || approver.trim().length === 0){
            throw new ValidationException(
                "Approver is required",
                "approver",
                approver
            )
        }

        // validate capabilities
        const validateCapabilities = ["Vision","Caching","Tools","Code","Multimodal","Audio","Video"]
        if(!validateCapabilities.includes(capabilities)){
            throw new ValidationException(
                "Capabilities needs to be one of: Vision | Caching | Tools | Code | Multimodal | Audio | Video",
                "capabilities",
                capabilities
            )
        }

        // validate security assessments
        const securityAssessments = ["Yes", "No"]
        if(!securityAssessments.includes(security_assessments)){
            throw new ValidationException(
                "The security assessments needs to be of: YES or NO",
                "security_assessments",
                security_assessments
            )
        }

        // validate statuses
        const validateStatuses = ["Approved","Pending","Restricted","Blocked"]
        if(!validateStatuses.includes(status)){
            throw new ValidationException(
                "The status needs to be one of Approved, Restricted, Pending or Blocked",
                "status",
                status
            )
        }

        // validate date picker
        if(!status_date){
            throw new ValidationException(
                "Needs to be a valid date",
                "status_date",
                status_date
            )
        }

        // Create and return the Model Inventory
        const modelInventory = new ModelInventory();
        modelInventory.model = model.trim();
        modelInventory.version = version.trim();
        modelInventory.approver = approver.trim();
        modelInventory.capabilities = capabilities;
        modelInventory.security_assessments = security_assessments;
        modelInventory.status = status;
        modelInventory.status_date = status_date;

        return modelInventory;

    }

    /**
     * Update the model inventory with validation
     */
    async updateModelInventory(updateData:{
        model?: string,
        version?: string,
        approver?: string,
        capabilities?: "Vision" | "Caching" | "Tools" | "Code" | "Multimodal" | "Audio" | "Video",
        security_assessments?: "Yes" | "No",
        status?: "Approved" | "Pending" | "Restricted" | "Blocked",
        status_date?: Date
    }): Promise<void> {
        // validate model if provided
        if(updateData.model !== undefined){
            if(!updateData.model ||
                updateData.model.trim().length === 0
            ){
                throw new ValidationException(
                    "Model name is required",
                    "model",
                    updateData.model
                );
            }
            this.model = updateData.model.trim();
        }

        // Validate version if provided
        // if(updateData.version !== undefined){
        //     if(!updateData.version || updateData.version.trim().length === 0){
        //         throw new ValidationException(
        //             "Version needs to be updated",
        //             "version",
        //             updateData.version
        //         )
        //     }
        //     this.version = updateData.version.trim();
        // }

        // Validate Approver if provided
        if(updateData.approver !== undefined){
            if(!updateData.approver || updateData.approver.trim().length === 0){
                throw new ValidationException(
                    "Approver required",
                    "approver",
                    updateData.approver
                )
            }
            this.approver = updateData.approver;
        }

        // update Capabilities
        const validCapabilities = ["Vision","Caching","Tools","Code","Multimodal","Audio","Video"]
        if(!validCapabilities.includes(this.capabilities)){
            throw new ValidationException(
                "Valid Capabilities is required",
                "capabilities",
                updateData.capabilities
            )
        }

        // update security assessments
        if(updateData.security_assessments !== undefined){
        const validSecurityAssessments = ["Yes","No"]
        if(!validSecurityAssessments.includes(this.security_assessments)){
            throw new ValidationException(
                "Valid Security Assessments is required",
                "security_assessments",
                updateData.security_assessments
            )
        }
        this.security_assessments = updateData.security_assessments;
    }

    // Need to update the status
    if(updateData.status !== undefined){
        const validStatuses = ["Approved","Pending","Restricted", "Blocked"]
        if(!validStatuses.includes(updateData.status)){
            throw new ValidationException(
                "Status must be one of: Approved, Pending, Restricted, Blocked",
                "status",
                updateData.status
            )
        }
        this.status = updateData.status;
    }

    // Validate the date picker
    if(updateData.status_date !== undefined){
        if(updateData.status_date > this.status_date){
            throw new ValidationException(
                "Updated Date should be greater that the current date",
                "status_date",
                updateData.status_date
            )
        }
        this.status_date = updateData.status_date;
    }

   }

   /**
    * Convert model Inventory data to JSON
    */
   toJSON(): any{
    return {
        id: this.id,
        model: this.model,
        version: this.version,
        approver: this.approver,
        capabilities:this.capabilities,
        security_assessments:this.security_assessments,
        status: this.status,
        status_date: this.status_date
    }
   }

   /**
    * Create ModelInventory instance from JSON data
    */
   static fromJSON(json: any):ModelInventory {
    return new ModelInventory(json);
   }

   /**
    *  Static method to find model inventory by ID with validation
    * 
    */
   static async findByIdWithValidation(
    id: number,
   ): Promise<ModelInventory>{
    if(!numberValidation(id,1)){
        throw new ValidationException(
            "Valid ID is required ( must be >= 1)",
            "id",
            id
        );
    }

    const modelInventory = await ModelInventory.findByPk(id);
    if(!modelInventory){
        throw new NotFoundException(
            "Model Inventory not found",
            "ModelInventory",
            id
        );
    }

    return modelInventory;
   }

   /**
    * Static methods to find model inventory by statuses
    */
   static async findByStatus(
    status: "Approved" | "Pending" | "Restricted" | "Blocked"
   ): Promise<ModelInventory[]> {
    const validStatuses = ["Approved","Pending","Restricted","Blocked"]
    if(!validStatuses.includes(status)){
        throw new ValidationException(
            "Valid status is required",
            "status",
            status
        )
    }

    return await ModelInventory.findAll({
        where: { status },
        order: [["model", "ASC"]]
    })
   }

   /**
    *  Static method to update model Inventory by ID
    * 
    */
   static async updateModelInventoryById(
    id: number,
    updateData: Partial<IModelInventory>
   ): Promise<[number,ModelInventory[]]> {
    if(!numberValidation(id,1)){
        throw new ValidationException(
            "Valid ID is required (must be >=1)",
            "id",
            id
        );
    }

    return await ModelInventory.update(updateData,{
        where: {id},
        returning: true
    });
   }

   /**
    * Static method deleting Model Inventory by ID
    */
   static async deleteModelInventoryById(
    id:number
   ): Promise<number>{
    if(!numberValidation(id,1)){
        throw new ValidationException(
            "Valid ID is required (must be >= 1)",
            "id",
            id
        );
    }

    return await ModelInventory.destroy({
        where: {id},
    });
   }

   constructor(init?: Partial<IModelInventory>){
    super();
    Object.assign(this, init);
   }
   
}
