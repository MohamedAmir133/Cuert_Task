# CUERT Task API

Backend REST API for managing users, projects, and tasks for the Cairo University Racing Team software task.

Live API:

```text
https://cuerttask-production.up.railway.app
```

<!-- Note: `GET /` returns `404` because this project is an API-only backend. Use the routes below. -->

## Requirements

- Node.js 18 or newer
- PostgreSQL database
- Supabase PostgreSQL or any PostgreSQL-compatible database
- Railway account for deployment

## Technologies

- Node.js
- Express.js
- PostgreSQL
- TypeORM
- JWT authentication
- bcryptjs password hashing
- dotenv environment variables

## Features

- Register new users
- Login users and return JWT tokens
- Hash user passwords with bcrypt
- Protect users, projects, and tasks routes with JWT authentication
- Create, read, update, and delete users
- Create, read, update, and delete projects
- Create, read, update, and delete tasks
- Restrict projects and tasks to project owners and members
- Assign tasks only to users who are members of the related project
- Filter and paginate users, projects, and tasks
- Return consistent JSON success and error responses

## Project Structure

```text
app.js                         Express app and route registration
server.js                      Database initialization and server start
controllers/                   Route handlers
routes/                        Express routers
dtos/                          Request validation and mapping
libs/config/database.js        TypeORM data source
libs/schemes/                  TypeORM entity schemas
middlewares/                   Auth and error middleware
seeds/seed.js                  Demo data seed script
utils/responses.js             Shared response helpers
```

## Environment Variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Local example:

```env
PORT=7000

DATABASE_URL=postgresql://postgres.your-project-ref:<encoded-password>@aws-0-your-region.pooler.supabase.com:5432/postgres
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=<plain-password>
DB_NAME=postgres
DB_SSL=true
DB_SYNC=true

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
```

Important:

- Do not commit real `.env` secrets.
- If the password contains special characters in `DATABASE_URL`, URL-encode them.
- For Supabase, the session pooler URL is recommended for hosting platforms.
- On Railway, do not set `PORT`; Railway injects it automatically.

## Installation

```bash
npm install
```

## Database Setup

The app uses TypeORM synchronize:

```env
DB_SYNC=true
```

For production projects, migrations are safer than synchronize. For this task/demo deployment, synchronize is enabled.

Seed the database:

```bash
npm run seed
```

Seed users:

| Name | Email | Password |
| --- | --- | --- |
| Ahmed Hassan | ahmed@example.com | password123 |
| Mona Ali | mona@example.com | password123 |
| Omar Samir | omar@example.com | password123 |

## Run Locally

```bash
npm start
```

Local base URL:

```text
http://localhost:7000
```

If `PORT` is not set, the app defaults to `3000`.

## Railway Deployment

1. Push the project to GitHub.
2. Create a new Railway project.
3. Choose Deploy from GitHub repo.
4. Select this repository.
5. Add environment variables in the Railway service Variables tab.
6. Do not add `PORT`.
7. Redeploy the service.

Railway runs:

```bash
npm start
```

The server binds to `0.0.0.0` for Railway compatibility.

Run the seed on Railway once using Railway CLI:

```bash
railway run npm run seed
```

## API Response Format

Success:

```json
{
  "success": true,
  "message": "Operation successful.",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {}
}
```

## Authentication

### Register

```http
POST /register
```

Body:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

### Login

```http
POST /login
```

Body:

```json
{
  "email": "ahmed@example.com",
  "password": "password123"
}
```

Use the returned token for protected routes:

```http
Authorization: Bearer <token>
```

## Users API

All `/api/users` routes require authentication.

```http
GET /api/users?page=1&limit=10&name=ahmed&email=example.com
POST /api/users
GET /api/users/:id
PATCH /api/users/:id
DELETE /api/users/:id
```

Create user body:

```json
{
  "name": "New User",
  "email": "new@example.com",
  "password": "password123"
}
```

Update user body:

```json
{
  "name": "Updated User",
  "email": "updated@example.com",
  "password": "newpass123"
}
```

## Projects API

All `/api/projects` routes require authentication.

```http
GET /api/projects?page=1&limit=10&name=aero
POST /api/projects
GET /api/projects/:id
PATCH /api/projects/:id
DELETE /api/projects/:id
```

Create project body:

```json
{
  "name": "Aerodynamics Package",
  "description": "Design and validate aero parts.",
  "memberIds": [1, 2]
}
```

Update project body:

```json
{
  "name": "Updated Project Name",
  "description": "Updated description.",
  "memberIds": [1, 3]
}
```

Rules:

- The authenticated user becomes the project owner.
- The owner is automatically added as a member.
- `memberIds` must contain existing user IDs.
- Only owners or members can access a project.

## Tasks API

All `/api/tasks` routes require authentication.

```http
GET /api/tasks?page=1&limit=10&status=Done&priority=High&projectId=1&assignedTo=2
POST /api/tasks
GET /api/tasks/:id
PATCH /api/tasks/:id
DELETE /api/tasks/:id
```

Create task body:

```json
{
  "title": "Run CFD baseline",
  "description": "Generate baseline CFD results.",
  "projectId": 1,
  "assignedTo": 2,
  "status": "In Progress",
  "priority": "High"
}
```

Update task body:

```json
{
  "title": "Updated task title",
  "description": "Updated task description.",
  "status": "Done",
  "priority": "Medium",
  "assignedTo": null
}
```

Allowed statuses:

```text
To Do, In Progress, Done
```

Allowed priorities:

```text
Low, Medium, High
```

Rules:

- `projectId` must be an existing project.
- The authenticated user must have access to the project.
- `assignedTo` can be `null`.
- If provided, `assignedTo` must be a member of the task project.

## Database Design

### User

- `id`
- `name`
- `email`
- `password`
- `createdAt`
- `updatedAt`

Relations:

- Many-to-many with projects as member
- One-to-many with owned projects
- One-to-many with assigned tasks

### Project

- `id`
- `name`
- `description`
- `createdAt`
- `updatedAt`

Relations:

- Many-to-one owner user
- Many-to-many member users
- One-to-many tasks

### Task

- `id`
- `title`
- `description`
- `status`
- `priority`
- `createdAt`
- `updatedAt`

Relations:

- Many-to-one project
- Many-to-one assignee user
<!-- 
## Validation And Errors

Common status codes:

- `200` successful request
- `201` resource created
- `400` validation error
- `401` missing or invalid authentication token
- `403` authenticated user is not allowed to access the resource
- `404` resource or route not found
- `409` duplicate email
- `500` internal server error -->

## Assumptions & Info

- I stoped at level 2.
- Project owners should also be project members.
- A task can only be assigned to a member of its project.
- TypeORM synchronize is acceptable for this task deployment.
