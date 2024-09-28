import { UserController } from "../controllers/user.controller";
import { UserInteractor } from "../interactors/implementations/userImpl.interactor";
import { UserRepository } from "../repositories/implementations/userImpl.repository";

const router = require("express").Router();

const repository = new UserRepository()
const interactor = new UserInteractor(repository);
const controller = new UserController(interactor);

router.get("/", controller.getAllUsers);
router.get("/:id", controller.getUser);
router.post("/", controller.createUser);
router.delete("/:id", controller.deleteUser);
router.patch("/:id", controller.updateUser);

module.exports = router;
