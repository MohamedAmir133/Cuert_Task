import { DataSource } from "typeorm";
import { UserSchema } from "../schemes/user_entity.js";
import { ProjectSchema } from "../schemes/project_entity.js";
import { TaskSchema } from "../schemes/task_entity.js";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "cuert_task",
    synchronize: process.env.DB_SYNC !== "false",
    logging: false,
    entities: [UserSchema, ProjectSchema, TaskSchema],
});
