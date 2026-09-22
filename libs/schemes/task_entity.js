import { EntitySchema } from "typeorm";

export const TaskSchema = new EntitySchema({
    name: "Task",
    tableName: "tasks",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true,
        },
        title: {
            type: "varchar",
        },
        description: {
            type: "text",
        },
        status: {
            type: "varchar",
            default: "To Do",
        },
        priority: {
            type: "varchar",
            default: "Medium",
        },
        createdAt: {
            type: "timestamp",
            createDate: true,
        },
        updatedAt: {
            type: "timestamp",
            updateDate: true,
        },
    },
    relations: {
        project: {
            type: "many-to-one",
            target: "Project",
            inverseSide: "tasks",
            onDelete: "CASCADE",
            nullable: false,
        },
        assignee: {
            type: "many-to-one",
            target: "User",
            inverseSide: "assignedTasks",
            nullable: true,
            onDelete: "SET NULL",
        },
    },
});

