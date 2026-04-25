# HAMS Backend — Claude Code Scaffold Instructions

> **How to use this file:**  
> Open VS Code in an empty folder called `hams-backend`, open Claude Code, and say:  
> _"Follow the instructions in this file step by step to scaffold the full HAMS backend project."_  
> Claude Code will execute each step in order. Do not skip steps — each builds on the previous.

---

## Project Overview

| Item | Value |
|------|-------|
| Project | Healthcare Appointment Management System — Backend API |
| Runtime | Node.js 20 LTS |
| Language | TypeScript 5 (strict mode) |
| Framework | Express.js 4 |
| Database | MongoDB 7 via Mongoose 8 |
| Validation | Joi 17 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Testing | Jest 29 + Supertest + mongodb-memory-server |
| Code Quality | ESLint + Prettier + SonarQube |
| Security | Helmet + express-rate-limit + OWASP ZAP (CI) |
| Performance | k6 load test scripts |
| Container | Docker + Docker Compose |

---

## STEP 1 — Initialise the Project

```bash
npm init -y
npm install --save-dev typescript ts-node-dev @types/node
npx tsc --init
```

Replace the generated `tsconfig.json` with exactly this:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## STEP 2 — Install All Dependencies

### Production dependencies
```bash
npm install express cors helmet express-rate-limit morgan \
  mongoose joi jsonwebtoken bcryptjs dotenv winston
```

### Dev dependencies
```bash
npm install --save-dev \
  @types/express @types/cors @types/morgan @types/bcryptjs \
  @types/jsonwebtoken @types/node @types/supertest @types/jest \
  @typescript-eslint/eslint-plugin @typescript-eslint/parser \
  eslint eslint-plugin-security prettier \
  jest ts-jest supertest mongodb-memory-server \
  ts-node-dev typescript
```

---

## STEP 3 — Create the Full Directory Structure

Create every folder and placeholder file listed below. Use `mkdir -p` for directories and `touch` for files.

```
src/
  config/
    env.ts
    database.ts
    logger.ts
  models/
    User.ts
    Patient.ts
    Doctor.ts
    TimeSlot.ts
    Appointment.ts
    EHR.ts
  controllers/
    authController.ts
    appointmentController.ts
    doctorController.ts
    slotController.ts
    ehrController.ts
  services/
    authService.ts
    appointmentService.ts
    doctorService.ts
    slotSuggestionService.ts
    ehrService.ts
  middleware/
    authenticate.ts
    authorise.ts
    validate.ts
    errorHandler.ts
  routes/
    auth.routes.ts
    appointment.routes.ts
    doctor.routes.ts
    slot.routes.ts
    ehr.routes.ts
    index.ts
  validators/
    auth.validator.ts
    appointment.validator.ts
    doctor.validator.ts
    slot.validator.ts
    ehr.validator.ts
  utils/
    errors.ts
    response.ts
    dateUtils.ts
  app.ts
  server.ts
tests/
  unit/
    services/
      authService.test.ts
      appointmentService.test.ts
      slotSuggestionService.test.ts
      ehrService.test.ts
  integration/
    auth.test.ts
    appointment.test.ts
    doctor.test.ts
    ehr.test.ts
  helpers/
    testDb.ts
    authHelper.ts
    fixtures.ts
k6/
  appointment-load.js
  auth-load.js
.env.example
.env
.gitignore
docker-compose.yml
Dockerfile
jest.config.ts
sonar-project.properties
.eslintrc.json
.prettierrc
```

---

## STEP 4 — Configuration Files

### `jest.config.ts`
```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/tests/'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testTimeout: 30000,
  setupFilesAfterFramework: ['<rootDir>/tests/helpers/testDb.ts'],
};

export default config;
```

### `.eslintrc.json`
```json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "security"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:security/recommended"
  ],
  "rules": {
    "no-console": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "security/detect-object-injection": "warn"
  },
  "env": { "node": true, "es2020": true }
}
```

### `.prettierrc`
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5"
}
```

### `package.json` — add these scripts
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write src/**/*.ts",
    "test": "jest",
    "test:unit": "jest --testPathPattern=tests/unit --coverage",
    "test:integration": "jest --testPathPattern=tests/integration --coverage",
    "test:all": "jest --coverage",
    "test:watch": "jest --watch"
  }
}
```

### `.env.example` (copy to `.env` and fill in values)
```
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb://localhost:27017/hams
JWT_SECRET=change-this-to-a-long-random-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change-this-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### `.gitignore`
```
node_modules/
dist/
coverage/
.env
*.log
logs/
.sonar/
```

### `sonar-project.properties`
```
sonar.projectKey=hams-backend
sonar.projectName=HAMS Backend
sonar.projectVersion=1.0
sonar.sources=src
sonar.tests=tests
sonar.language=ts
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.exclusions=**/node_modules/**,**/dist/**
sonar.coverage.exclusions=**/migrations/**
```

---

## STEP 5 — Implement Config Layer (`src/config/`)

### `src/config/env.ts`
- Import `dotenv` and call `dotenv.config()`
- Export a typed `env` object with these keys: `NODE_ENV`, `PORT` (number), `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `BCRYPT_ROUNDS` (number), `RATE_LIMIT_WINDOW_MS` (number), `RATE_LIMIT_MAX` (number)
- Parse all numeric values with `parseInt`

### `src/config/database.ts`
- Export `connectDatabase(): Promise<void>`
- Use `mongoose.connect(env.MONGO_URI)`
- Log success with logger; call `process.exit(1)` on failure
- Register `disconnected` and `error` event listeners on `mongoose.connection`

### `src/config/logger.ts`
- Use `winston.createLogger`
- Level: `debug` in dev, `warn` in production
- Format: combine `timestamp()`, `errors({ stack: true })`, colorize in dev, JSON in production
- Transports: always Console; in production also add File transports for `logs/error.log` and `logs/combined.log`

---

## STEP 6 — Implement Utility Layer (`src/utils/`)

### `src/utils/errors.ts`
Create these typed error classes, all extending `Error`:

| Class | HTTP Status | Extra fields |
|-------|-------------|--------------|
| `AppError` | configurable | `statusCode: number`, `isOperational: boolean` |
| `ValidationError extends AppError` | 422 | `errors?: object` |
| `NotFoundError extends AppError` | 404 | — |
| `UnauthorizedError extends AppError` | 401 | — |
| `ForbiddenError extends AppError` | 403 | — |
| `ConflictError extends AppError` | 409 | — |

Use `Error.captureStackTrace` in `AppError` constructor.

### `src/utils/response.ts`
Export two helper functions:
```typescript
export const successResponse = <T>(data: T, message = 'Success', statusCode = 200) =>
  ({ success: true, message, data, statusCode });

export const paginatedResponse = <T>(
  data: T[], total: number, page: number, limit: number
) => ({
  success: true, data,
  pagination: { total, page, limit, pages: Math.ceil(total / limit) }
});
```

### `src/utils/dateUtils.ts`
Export these pure functions (no external deps):
- `isDateInFuture(date: Date): boolean`
- `addMinutes(date: Date, minutes: number): Date`
- `isSameDay(a: Date, b: Date): boolean`
- `formatDate(date: Date): string` — returns `YYYY-MM-DD` string

---

## STEP 7 — Implement Mongoose Models (`src/models/`)

### `src/models/User.ts`
- Interface `IUser extends Document`: `email`, `passwordHash`, `role: UserRole ('PATIENT'|'DOCTOR'|'ADMIN')`, `isActive: boolean`, timestamps
- Pre-save hook: hash `passwordHash` using bcrypt when modified, using `env.BCRYPT_ROUNDS`
- Instance method `comparePassword(candidate: string): Promise<boolean>`
- `toJSON` method: delete `passwordHash` before returning
- Unique index on `email`

### `src/models/Patient.ts`
- Interface `IPatient extends Document`: `userId (ObjectId ref User)`, `firstName`, `lastName`, `dateOfBirth`, `contactNumber`, `insuranceId?`, `address?`, `bloodGroup? (enum A+/A-/B+/B-/AB+/AB-/O+/O-)`, `allergies: string[]`, timestamps
- Unique index on `userId`

### `src/models/Doctor.ts`
- Interface `IDoctor extends Document`: `userId (ObjectId ref User)`, `firstName`, `lastName`, `specialisation`, `licenseNumber (unique)`, `contactNumber`, `bio?`, `consultationFee: number`, `isAvailable: boolean (default true)`, timestamps
- Index on `specialisation`, `isAvailable`

### `src/models/TimeSlot.ts`
- Interface `ITimeSlot extends Document`: `doctorId (ObjectId ref Doctor)`, `startTime: Date`, `endTime: Date`, `durationMinutes: number (default 30, min 15)`, `isAvailable: boolean (default true)`, timestamps
- Compound index on `{ doctorId, isAvailable }` and `{ startTime: 1 }`

### `src/models/Appointment.ts`
- Interface `IAppointment extends Document`: `patientId (ObjectId ref Patient)`, `doctorId (ObjectId ref Doctor)`, `slotId (ObjectId ref TimeSlot)`, `status: AppointmentStatus ('PENDING'|'CONFIRMED'|'CANCELLED'|'COMPLETED', default PENDING)`, `type: AppointmentType ('IN_PERSON'|'TELEMEDICINE', default IN_PERSON)`, `notes? (maxlength 500)`, `cancelReason?`, timestamps
- Index on `{ patientId, status }` and `{ doctorId, status }`

### `src/models/EHR.ts`
- Sub-document `IClinicalNote`: `doctorId (ObjectId ref Doctor)`, `note: string`, `createdAt: Date`
- Interface `IEHRRecord extends Document`: `patientId (ObjectId ref Patient, unique)`, `bloodGroup?`, `allergies: string[]`, `chronicConditions: string[]`, `currentMedications: string[]`, `clinicalNotes: IClinicalNote[]`, `lastUpdated: Date`, timestamps

---

## STEP 8 — Implement Middleware (`src/middleware/`)

### `src/middleware/authenticate.ts`
- Extend `Request` as `AuthRequest` adding `user?: { userId, email, role }`
- `authenticate` middleware:
  1. Check `Authorization: Bearer <token>` header — throw `UnauthorizedError` if missing
  2. Verify JWT with `env.JWT_SECRET` — throw typed errors for expired/invalid
  3. Fetch user from DB, check `isActive` — throw if not found/inactive
  4. Attach decoded payload to `req.user`

### `src/middleware/authorise.ts`
- Export `authorise(...roles: UserRole[])` returning a middleware
- Check `req.user` exists, then check `req.user.role` is in the allowed roles
- Throw `ForbiddenError` if not permitted

### `src/middleware/validate.ts`
- Export `validate(schema: Joi.ObjectSchema, target: 'body'|'query'|'params' = 'body')`
- Run `schema.validate(req[target], { abortEarly: false, stripUnknown: true })`
- On error: map `error.details` to `{ fieldName: message }` object, throw `ValidationError`
- On success: replace `req[target]` with the stripped value, call `next()`

### `src/middleware/errorHandler.ts`
- Global Express error handler `(err, req, res, next)`
- Handle: `ValidationError` → 422 with `errors` object
- Handle: any `AppError` → use its `statusCode`
- Handle: Mongoose duplicate key error (code 11000) → 409
- Handle: JWT errors → 401
- Fallback: 500, never expose stack trace in production
- Always log error with `logger.error`

---

## STEP 9 — Implement Joi Validators (`src/validators/`)

### `src/validators/auth.validator.ts`

`registerSchema`:
- `email`: string, email, required, lowercase, trim
- `password`: string, min 8, must match `/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/`, custom message
- `role`: valid `PATIENT` or `DOCTOR`
- `firstName`, `lastName`: string, min 2, max 50, required
- `dateOfBirth`: date, max now, required only when role is PATIENT
- `contactNumber`: matches phone pattern
- `specialisation`, `licenseNumber`, `consultationFee`: required only when role is DOCTOR

`loginSchema`:
- `email`: string, email, required
- `password`: string, required

### `src/validators/appointment.validator.ts`

`createAppointmentSchema`:
- `slotId`: string, valid ObjectId format, required
- `doctorId`: string, valid ObjectId format, required
- `type`: valid `IN_PERSON` or `TELEMEDICINE`, default `IN_PERSON`
- `notes`: string, max 500, optional

`updateAppointmentSchema`:
- `status`: valid `CONFIRMED`|`CANCELLED`|`COMPLETED`, required
- `cancelReason`: string, required when status is CANCELLED

### `src/validators/doctor.validator.ts`

`setAvailabilitySchema`:
- `slots`: array of objects, min 1, required
  - `startTime`: ISO date string, must be in future
  - `endTime`: ISO date string, must be after startTime
  - `durationMinutes`: number, min 15, max 120, default 30

### `src/validators/slot.validator.ts`

`getSlotsQuerySchema`:
- `doctorId`: string, ObjectId format, required
- `date`: ISO date string, optional
- `specialisation`: string, optional

### `src/validators/ehr.validator.ts`

`addClinicalNoteSchema`:
- `note`: string, min 10, max 2000, required

`updateEHRSchema`:
- `allergies`: array of strings, optional
- `chronicConditions`: array of strings, optional
- `currentMedications`: array of strings, optional
- `bloodGroup`: valid enum, optional

---

## STEP 10 — Implement Services (`src/services/`)

### `src/services/authService.ts`

Export class `AuthService` with these methods:

**`register(data: RegisterDto): Promise<{ user, token, refreshToken }>`**
1. Check if email already exists in User model — throw `ConflictError` if so
2. Create `User` with `passwordHash = data.password` (pre-save hook hashes it)
3. If `role === 'PATIENT'`: create `Patient` record linked to user, and create empty `EHR` record
4. If `role === 'DOCTOR'`: create `Doctor` record linked to user
5. Sign JWT with `{ userId, email, role }` payload, `env.JWT_SECRET`, `expiresIn: env.JWT_EXPIRES_IN`
6. Sign refresh token with `env.JWT_REFRESH_SECRET`, `expiresIn: env.JWT_REFRESH_EXPIRES_IN`
7. Return `{ user, token, refreshToken }`

**`login(email: string, password: string): Promise<{ user, token, refreshToken }>`**
1. Find user by email, select `+passwordHash` explicitly
2. Throw `UnauthorizedError('Invalid credentials')` if not found
3. Call `user.comparePassword(password)` — throw same generic error if false (prevent enumeration)
4. Throw `UnauthorizedError('Account inactive')` if `!user.isActive`
5. Sign and return tokens same as register

**`refreshToken(token: string): Promise<{ token, refreshToken }>`**
1. Verify with `env.JWT_REFRESH_SECRET` — throw `UnauthorizedError` on failure
2. Find user, check isActive
3. Issue new access token and refresh token pair

### `src/services/doctorService.ts`

**`getAllDoctors(filters: { specialisation?, isAvailable? }): Promise<IDoctor[]>`**
- Query Doctor model with optional filters
- Populate `userId` (select email only)
- Return sorted by `firstName`

**`getDoctorById(doctorId: string): Promise<IDoctor>`**
- Find by `_id`, throw `NotFoundError('Doctor')` if missing
- Populate `userId`

**`getDoctorByUserId(userId: string): Promise<IDoctor>`**
- Find by `userId`, throw `NotFoundError('Doctor profile')` if missing

**`setAvailability(doctorId: string, slots: SlotDto[]): Promise<ITimeSlot[]>`**
1. Verify doctor exists
2. Validate no two slots overlap for the same doctor on the same day
3. Bulk insert `TimeSlot` documents using `insertMany`
4. Return created slots

**`getSchedule(doctorId: string): Promise<IAppointment[]>`**
- Query Appointment model where `doctorId` matches and status is not `CANCELLED`
- Populate `patientId` (firstName, lastName, contactNumber)
- Populate `slotId`
- Sort by slot `startTime` ascending

### `src/services/appointmentService.ts`

**`createAppointment(patientId: string, data: CreateAppointmentDto): Promise<IAppointment>`**
1. Find patient profile by `userId` — throw `NotFoundError` if missing
2. Find the `TimeSlot` by `data.slotId` — throw `NotFoundError` if missing
3. Check `slot.isAvailable === true` — throw `ConflictError('Slot no longer available')` if not
4. Use a Mongoose session + transaction:
   - Create `Appointment` document
   - Set `slot.isAvailable = false`, save slot
5. Return populated appointment (populate slot, doctor name)

**`getPatientAppointments(patientId: string, status?: string): Promise<IAppointment[]>`**
- Find patient by userId, then query appointments
- Optionally filter by status
- Populate `doctorId` (firstName, lastName, specialisation) and `slotId`
- Sort by `createdAt` descending

**`updateAppointmentStatus(appointmentId: string, userId: string, role: UserRole, dto: UpdateDto): Promise<IAppointment>`**
1. Find appointment by `_id`, populate slot
2. Authorisation checks:
   - PATIENT can only cancel their own appointments
   - DOCTOR can confirm or complete their own appointments
   - ADMIN can do anything
3. If cancelling: set `slot.isAvailable = true` in a transaction
4. Update status and `cancelReason` if provided
5. Return updated appointment

**`getAppointmentById(id: string): Promise<IAppointment>`**
- Find by `_id`, throw `NotFoundError` if missing
- Populate patient, doctor, slot

### `src/services/slotSuggestionService.ts`

**`getSuggestedSlots(dto: { doctorId?, specialisation?, preferredDate? }): Promise<ScoredSlot[]>`**

Implement the priority scoring algorithm:
1. Build query: find available `TimeSlot` documents (`isAvailable: true`)
   - If `doctorId` provided: filter by that doctor
   - If `specialisation` provided: find all doctors with that specialisation first, then filter slots
   - If `preferredDate` provided: filter slots within ±3 days of that date
2. For each slot, compute a `priorityScore` (0–100):
   - **Date proximity** (40 pts): slots on `preferredDate` get 40, each day away loses 10
   - **Slot timing** (30 pts): morning slots (8–12) get 30, afternoon (12–17) get 20, evening get 10
   - **Duration** (30 pts): 30-min slots get 30, 60-min get 20, others get 10
3. Sort by `priorityScore` descending
4. Return top 10 results with slot details and doctor info populated

**`getAvailableSlotsByDoctor(doctorId: string, date?: Date): Promise<ITimeSlot[]>`**
- Find all available slots for doctor
- If `date` provided, filter to same calendar day
- Sort by `startTime`

### `src/services/ehrService.ts`

**`getEHRByPatientId(patientId: string, requestingUserId: string, requestingRole: UserRole): Promise<IEHRRecord>`**
1. If role is PATIENT: find patient by userId, verify they own this record
2. If role is DOCTOR: allow access (they are treating the patient)
3. Find EHR by `patientId`, throw `NotFoundError('EHR')` if missing
4. Return record

**`updateEHR(patientId: string, dto: UpdateEHRDto): Promise<IEHRRecord>`**
- Find and update EHR by `patientId` using `findOneAndUpdate` with `{ new: true }`
- Update `lastUpdated = new Date()`
- Throw `NotFoundError` if missing

**`addClinicalNote(patientId: string, doctorUserId: string, note: string): Promise<IEHRRecord>`**
1. Find Doctor by `userId = doctorUserId`
2. Find EHR by `patientId`
3. Push new `ClinicalNote` `{ doctorId, note, createdAt: new Date() }` to `clinicalNotes` array
4. Set `lastUpdated = new Date()`
5. Save and return updated EHR

---

## STEP 11 — Implement Controllers (`src/controllers/`)

All controllers follow this pattern:
- Wrap logic in `try/catch`, pass errors to `next(err)`
- Use `res.status(X).json(successResponse(data, message))`
- Extract user context from `(req as AuthRequest).user`

### `src/controllers/authController.ts`
- `register`: call `authService.register(req.body)` → 201
- `login`: call `authService.login(email, password)` → 200
- `refreshToken`: call `authService.refreshToken(req.body.refreshToken)` → 200
- `getMe`: return `req.user` → 200

### `src/controllers/appointmentController.ts`
- `createAppointment`: call service, return 201
- `getMyAppointments`: get patientId from req.user, call service, return 200
- `updateAppointment`: call service with appointmentId, userId, role, body, return 200
- `getAppointmentById`: call service, return 200

### `src/controllers/doctorController.ts`
- `getAllDoctors`: pass query filters from `req.query`, return 200
- `getDoctorById`: return 200
- `setAvailability`: get doctorId from doctor profile (via userId), call service, return 201
- `getMySchedule`: get doctor profile via userId, return 200

### `src/controllers/slotController.ts`
- `getSuggestedSlots`: pass `req.query` to service, return 200
- `getSlotsByDoctor`: return 200

### `src/controllers/ehrController.ts`
- `getMyEHR`: for PATIENT — find their patient profile, call service
- `getPatientEHR`: for DOCTOR — call service with patientId from params
- `updateEHR`: PATIENT updates own EHR fields, return 200
- `addClinicalNote`: DOCTOR adds note, return 200

---

## STEP 12 — Implement Routes (`src/routes/`)

### `src/routes/auth.routes.ts`
```
POST   /api/v1/auth/register     → validate(registerSchema) → authController.register
POST   /api/v1/auth/login        → validate(loginSchema)    → authController.login
POST   /api/v1/auth/refresh      → authController.refreshToken
GET    /api/v1/auth/me           → authenticate → authController.getMe
```

### `src/routes/appointment.routes.ts`
```
POST   /api/v1/appointments            → authenticate → authorise(PATIENT) → validate(createAppointmentSchema) → createAppointment
GET    /api/v1/appointments/my         → authenticate → authorise(PATIENT) → getMyAppointments
GET    /api/v1/appointments/:id        → authenticate → getAppointmentById
PATCH  /api/v1/appointments/:id/status → authenticate → validate(updateAppointmentSchema) → updateAppointment
```

### `src/routes/doctor.routes.ts`
```
GET    /api/v1/doctors                 → getAllDoctors  (public)
GET    /api/v1/doctors/:id             → getDoctorById (public)
POST   /api/v1/doctors/availability    → authenticate → authorise(DOCTOR) → validate(setAvailabilitySchema) → setAvailability
GET    /api/v1/doctors/schedule/my     → authenticate → authorise(DOCTOR) → getMySchedule
```

### `src/routes/slot.routes.ts`
```
GET    /api/v1/slots/suggest           → authenticate → validate(getSlotsQuerySchema, 'query') → getSuggestedSlots
GET    /api/v1/slots/doctor/:doctorId  → authenticate → getSlotsByDoctor
```

### `src/routes/ehr.routes.ts`
```
GET    /api/v1/ehr/my                  → authenticate → authorise(PATIENT) → getMyEHR
GET    /api/v1/ehr/:patientId          → authenticate → authorise(DOCTOR, ADMIN) → getPatientEHR
PATCH  /api/v1/ehr/my                  → authenticate → authorise(PATIENT) → validate(updateEHRSchema) → updateEHR
POST   /api/v1/ehr/:patientId/notes    → authenticate → authorise(DOCTOR) → validate(addClinicalNoteSchema) → addClinicalNote
```

### `src/routes/index.ts`
Mount all routers. Also add:
```
GET    /health   → returns { status: 'ok', timestamp: new Date() }
```

---

## STEP 13 — Implement Express App (`src/app.ts`)

Create and export the Express app (do NOT call `listen` here — keeps app testable):

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes/index';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));

// Rate limiting — apply to all /api routes
app.use('/api', rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: { success: false, message: 'Too many requests, please try again later' },
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));  // Limit body size — security best practice
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// HTTP request logging
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Routes
app.use(routes);

// Global error handler — MUST be last
app.use(errorHandler);

export default app;
```

### `src/server.ts`
```typescript
import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';

const start = async (): Promise<void> => {
  await connectDatabase();
  app.listen(env.PORT, () => {
    logger.info(`HAMS API running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
};

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
```

---

## STEP 14 — Implement Test Helpers (`tests/helpers/`)

### `tests/helpers/testDb.ts`
```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

export const connectTestDb = async (): Promise<void> => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

export const clearTestDb = async (): Promise<void> => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

export const closeTestDb = async (): Promise<void> => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};
```

### `tests/helpers/authHelper.ts`
```typescript
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';
import { UserRole } from '../../src/models/User';

export const signTestToken = (payload: { userId: string; email: string; role: UserRole }): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
```

### `tests/helpers/fixtures.ts`
Create factory functions that return test data objects (not saved to DB):
- `createPatientUserFixture()` — returns valid register body for a PATIENT
- `createDoctorUserFixture()` — returns valid register body for a DOCTOR
- `createSlotFixture(doctorId: string)` — returns a valid TimeSlot-like object
- `createAppointmentFixture(patientId, doctorId, slotId)` — returns Appointment body

---

## STEP 15 — Implement Unit Tests (`tests/unit/services/`)

### `tests/unit/services/authService.test.ts`

Test `AuthService`:
- `register()`: success case returns user + tokens; duplicate email throws ConflictError; creates Patient profile for PATIENT role; creates Doctor profile for DOCTOR role
- `login()`: valid credentials return tokens; wrong password throws UnauthorizedError; inactive user throws UnauthorizedError
- Use `jest.mock` to mock `User`, `Patient`, `Doctor`, `EHR` models — do not use a real DB in unit tests

### `tests/unit/services/slotSuggestionService.test.ts`

Test `SlotSuggestionService.getSuggestedSlots()`:
- Returns results sorted by priorityScore descending
- Morning slots score higher than evening slots (given same date)
- Empty array when no slots available
- Filters by doctorId correctly
- Filters by specialisation correctly
- Results capped at 10 items maximum
- Throws ValidationError for empty query object

### `tests/unit/services/appointmentService.test.ts`

Test `AppointmentService`:
- `createAppointment()`: creates appointment when slot is available; throws ConflictError when slot not available; throws NotFoundError for missing patient
- `updateAppointmentStatus()`: PATIENT cannot confirm (ForbiddenError); DOCTOR can confirm own appointment; PATIENT can cancel own appointment; cancelling frees the slot

### `tests/unit/services/ehrService.test.ts`

Test `EHRService`:
- `getEHRByPatientId()`: patient can access own EHR; doctor can access any patient EHR; throws NotFoundError for missing EHR
- `addClinicalNote()`: appends note to clinicalNotes array; updates lastUpdated timestamp

---

## STEP 16 — Implement Integration Tests (`tests/integration/`)

Use `connectTestDb / clearTestDb / closeTestDb` helpers in `beforeAll/afterEach/afterAll`.

### `tests/integration/auth.test.ts`

```
POST /api/v1/auth/register
  ✓ 201 — registers PATIENT with valid data
  ✓ 201 — registers DOCTOR with valid data
  ✓ 409 — duplicate email
  ✓ 422 — missing password
  ✓ 422 — weak password (no special char)
  ✓ 422 — missing specialisation for DOCTOR role

POST /api/v1/auth/login
  ✓ 200 — returns token on valid credentials
  ✓ 401 — invalid password
  ✓ 401 — unknown email
  ✓ 422 — missing email

GET /api/v1/auth/me
  ✓ 200 — returns user when authenticated
  ✓ 401 — missing token
  ✓ 401 — expired token
```

### `tests/integration/appointment.test.ts`

```
POST /api/v1/appointments
  ✓ 201 — patient creates appointment for available slot
  ✓ 409 — slot already taken (double-booking prevention)
  ✓ 401 — unauthenticated request
  ✓ 403 — doctor role cannot book as patient
  ✓ 422 — missing slotId

GET /api/v1/appointments/my
  ✓ 200 — returns patient's appointments
  ✓ 200 — empty array when no appointments

PATCH /api/v1/appointments/:id/status
  ✓ 200 — doctor confirms appointment
  ✓ 200 — patient cancels appointment, slot becomes available again
  ✓ 403 — patient cannot confirm appointment
  ✓ 422 — missing cancelReason when cancelling
```

### `tests/integration/doctor.test.ts`

```
GET /api/v1/doctors
  ✓ 200 — returns list of doctors (public endpoint)
  ✓ 200 — filters by specialisation

POST /api/v1/doctors/availability
  ✓ 201 — doctor sets availability slots
  ✓ 401 — unauthenticated
  ✓ 403 — patient cannot set availability
  ✓ 422 — past date rejected

GET /api/v1/doctors/schedule/my
  ✓ 200 — returns doctor's upcoming confirmed appointments
```

### `tests/integration/ehr.test.ts`

```
GET /api/v1/ehr/my
  ✓ 200 — patient retrieves own EHR
  ✓ 401 — unauthenticated

GET /api/v1/ehr/:patientId
  ✓ 200 — doctor retrieves patient EHR
  ✓ 403 — patient cannot retrieve another patient's EHR

POST /api/v1/ehr/:patientId/notes
  ✓ 200 — doctor adds clinical note
  ✓ 403 — patient cannot add clinical note
  ✓ 422 — note too short (< 10 chars)
```

---

## STEP 17 — Docker Files

### `Dockerfile`
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 4000
USER node
CMD ["node", "dist/server.js"]
```

### `docker-compose.yml`
```yaml
version: '3.9'
services:
  api:
    build: .
    ports: ['4000:4000']
    environment:
      NODE_ENV: development
      MONGO_URI: mongodb://mongo:27017/hams
      JWT_SECRET: ${JWT_SECRET:-dev-secret}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:-dev-refresh-secret}
    depends_on:
      mongo:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'wget', '-qO-', 'http://localhost:4000/health']
      interval: 30s
      timeout: 10s
      retries: 3

  mongo:
    image: mongo:7
    ports: ['27017:27017']
    volumes: ['mongo-data:/data/db']
    healthcheck:
      test: ['CMD', 'mongosh', '--eval', 'db.adminCommand("ping")']
      interval: 10s
      timeout: 5s
      retries: 5

  sonarqube:
    image: sonarqube:10-community
    ports: ['9000:9000']
    environment:
      SONAR_ES_BOOTSTRAP_CHECKS_DISABLE: 'true'
    volumes:
      - sonar-data:/opt/sonarqube/data
      - sonar-logs:/opt/sonarqube/logs

volumes:
  mongo-data:
  sonar-data:
  sonar-logs:
```

---

## STEP 18 — k6 Performance Test Script

### `k6/appointment-load.js`
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m',  target: 20  },
    { duration: '3m',  target: 50  },
    { duration: '1m',  target: 200 },
    { duration: '2m',  target: 50  },
    { duration: '1m',  target: 0   },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<600'],
    errors:            ['rate<0.01'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:4000';

export default function () {
  const token = __ENV.TEST_TOKEN;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const slots = http.get(`${BASE}/api/v1/slots/suggest?specialisation=Cardiology`, { headers });
  check(slots, { 'slots 200': (r) => r.status === 200 });
  errorRate.add(slots.status !== 200);

  sleep(1);

  const body = JSON.stringify({ slotId: __ENV.TEST_SLOT_ID, doctorId: __ENV.TEST_DOCTOR_ID, type: 'IN_PERSON' });
  const appt = http.post(`${BASE}/api/v1/appointments`, body, { headers });
  check(appt, { 'appt created or conflict': (r) => r.status === 201 || r.status === 409 });
  errorRate.add(appt.status >= 500);

  sleep(Math.random() * 2);
}
```

---

## STEP 19 — GitHub Actions CI Workflow

### `.github/workflows/ci.yml`
```yaml
name: HAMS Backend CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run test:all
      - uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/lcov.info

  sonarqube:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/download-artifact@v4
        with: { name: coverage, path: coverage }
      - uses: SonarSource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
      - uses: SonarSource/sonarqube-quality-gate-action@master
        env: { SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }} }

  security:
    needs: sonarqube
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm audit --audit-level=high
      - run: docker compose up -d && sleep 15
      - uses: zaproxy/action-baseline@v0.11.0
        with:
          target: 'http://localhost:4000'
          fail_action: true
```

---

## STEP 20 — Final Checks

Run all these commands and confirm they pass before considering the backend complete:

```bash
# 1. Type check — should produce zero errors
npm run typecheck

# 2. Lint — should produce zero errors
npm run lint

# 3. Unit tests — coverage must be ≥ 80% on all metrics
npm run test:unit

# 4. Integration tests — all must pass
npm run test:integration

# 5. Build — dist/ folder should be generated
npm run build

# 6. Docker Compose — all services healthy
docker compose up --build -d
docker compose ps

# 7. Health check
curl http://localhost:4000/health
# Expected: { "status": "ok", "timestamp": "..." }
```

---

## API Summary Reference

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | /api/v1/auth/register | No | — |
| POST | /api/v1/auth/login | No | — |
| POST | /api/v1/auth/refresh | No | — |
| GET | /api/v1/auth/me | Yes | Any |
| GET | /api/v1/doctors | No | — |
| GET | /api/v1/doctors/:id | No | — |
| POST | /api/v1/doctors/availability | Yes | DOCTOR |
| GET | /api/v1/doctors/schedule/my | Yes | DOCTOR |
| GET | /api/v1/slots/suggest | Yes | Any |
| GET | /api/v1/slots/doctor/:id | Yes | Any |
| POST | /api/v1/appointments | Yes | PATIENT |
| GET | /api/v1/appointments/my | Yes | PATIENT |
| GET | /api/v1/appointments/:id | Yes | Any |
| PATCH | /api/v1/appointments/:id/status | Yes | Any |
| GET | /api/v1/ehr/my | Yes | PATIENT |
| GET | /api/v1/ehr/:patientId | Yes | DOCTOR, ADMIN |
| PATCH | /api/v1/ehr/my | Yes | PATIENT |
| POST | /api/v1/ehr/:patientId/notes | Yes | DOCTOR |
