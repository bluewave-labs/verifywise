import { Request } from "express"
import { User } from "../models/user.model"
export interface IUserAuthRequest extends Request {
  user?: User
}
