import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'HAMS API',
      version: '1.0.0',
      description: 'Healthcare Appointment Management System — REST API',
    },
    servers: [{ url: '/api/v1', description: 'API v1' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
        // ── Auth ──────────────────────────────────────────────────────────
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'role', 'firstName', 'lastName'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8, example: 'Secret@123' },
            role: { type: 'string', enum: ['PATIENT', 'DOCTOR'] },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            dateOfBirth: { type: 'string', format: 'date', description: 'Required for PATIENT' },
            contactNumber: { type: 'string' },
            specialisation: { type: 'string', description: 'Required for DOCTOR' },
            licenseNumber: { type: 'string', description: 'Required for DOCTOR' },
            consultationFee: { type: 'number', description: 'Required for DOCTOR' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                refreshToken: { type: 'string' },
                user: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['PATIENT', 'DOCTOR', 'ADMIN'] },
            isActive: { type: 'boolean' },
          },
        },
        // ── Doctor ────────────────────────────────────────────────────────
        Doctor: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            specialisation: { type: 'string' },
            licenseNumber: { type: 'string' },
            contactNumber: { type: 'string' },
            bio: { type: 'string' },
            consultationFee: { type: 'number' },
            isAvailable: { type: 'boolean' },
          },
        },
        SetAvailabilityRequest: {
          type: 'object',
          required: ['slots'],
          properties: {
            slots: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['startTime', 'endTime'],
                properties: {
                  startTime: { type: 'string', format: 'date-time' },
                  endTime: { type: 'string', format: 'date-time' },
                  durationMinutes: { type: 'integer', minimum: 15, maximum: 120, default: 30 },
                },
              },
            },
          },
        },
        // ── Slots ─────────────────────────────────────────────────────────
        TimeSlot: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            doctorId: { type: 'string' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            durationMinutes: { type: 'integer' },
            isAvailable: { type: 'boolean' },
          },
        },
        ScoredSlot: {
          allOf: [
            { $ref: '#/components/schemas/TimeSlot' },
            {
              type: 'object',
              properties: { priorityScore: { type: 'integer', minimum: 0, maximum: 100 } },
            },
          ],
        },
        // ── Appointment ───────────────────────────────────────────────────
        CreateAppointmentRequest: {
          type: 'object',
          required: ['slotId', 'doctorId'],
          properties: {
            slotId: { type: 'string' },
            doctorId: { type: 'string' },
            type: { type: 'string', enum: ['IN_PERSON', 'TELEMEDICINE'], default: 'IN_PERSON' },
            notes: { type: 'string', maxLength: 500 },
          },
        },
        UpdateAppointmentRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['CONFIRMED', 'CANCELLED', 'COMPLETED'] },
            cancelReason: { type: 'string', description: 'Required when status is CANCELLED' },
          },
        },
        Appointment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            patientId: { type: 'string' },
            doctorId: { type: 'string' },
            slotId: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] },
            type: { type: 'string', enum: ['IN_PERSON', 'TELEMEDICINE'] },
            notes: { type: 'string' },
            cancelReason: { type: 'string' },
          },
        },
        // ── EHR ───────────────────────────────────────────────────────────
        EHR: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            patientId: { type: 'string' },
            bloodGroup: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
            allergies: { type: 'array', items: { type: 'string' } },
            chronicConditions: { type: 'array', items: { type: 'string' } },
            currentMedications: { type: 'array', items: { type: 'string' } },
            clinicalNotes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  doctorId: { type: 'string' },
                  note: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            lastUpdated: { type: 'string', format: 'date-time' },
          },
        },
        UpdateEHRRequest: {
          type: 'object',
          properties: {
            bloodGroup: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
            allergies: { type: 'array', items: { type: 'string' } },
            chronicConditions: { type: 'array', items: { type: 'string' } },
            currentMedications: { type: 'array', items: { type: 'string' } },
          },
        },
        AddClinicalNoteRequest: {
          type: 'object',
          required: ['note'],
          properties: {
            note: { type: 'string', minLength: 10, maxLength: 2000 },
          },
        },
      },
    },
    paths: {
      // ── Health ────────────────────────────────────────────────────────
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: {
            '200': { description: 'Service is healthy' },
          },
        },
      },
      // ── Auth ──────────────────────────────────────────────────────────
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user (PATIENT or DOCTOR)',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
          },
          responses: {
            '201': { description: 'Registered successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            '409': { description: 'Email already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '422': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and receive JWT tokens',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
          },
          responses: {
            '200': { description: 'Authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '422': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } } },
          },
          responses: {
            '200': { description: 'New token pair issued' },
            '401': { description: 'Invalid or expired refresh token' },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current authenticated user',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Current user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            '401': { description: 'Unauthorized' },
          },
        },
      },
      // ── Doctors ───────────────────────────────────────────────────────
      '/doctors': {
        get: {
          tags: ['Doctors'],
          summary: 'List all doctors (public)',
          parameters: [
            { name: 'specialisation', in: 'query', schema: { type: 'string' } },
            { name: 'isAvailable', in: 'query', schema: { type: 'boolean' } },
          ],
          responses: {
            '200': { description: 'Doctor list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Doctor' } } } } },
          },
        },
      },
      '/doctors/{id}': {
        get: {
          tags: ['Doctors'],
          summary: 'Get doctor by ID (public)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Doctor details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Doctor' } } } },
            '404': { description: 'Not found' },
          },
        },
      },
      '/doctors/availability': {
        post: {
          tags: ['Doctors'],
          summary: 'Set doctor availability slots (DOCTOR only)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SetAvailabilityRequest' } } },
          },
          responses: {
            '201': { description: 'Slots created', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/TimeSlot' } } } } },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
            '422': { description: 'Validation error' },
          },
        },
      },
      '/doctors/schedule/my': {
        get: {
          tags: ['Doctors'],
          summary: "Get authenticated doctor's schedule (DOCTOR only)",
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Doctor schedule', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Appointment' } } } } },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
          },
        },
      },
      // ── Slots ─────────────────────────────────────────────────────────
      '/slots/suggest': {
        get: {
          tags: ['Slots'],
          summary: 'Get AI-scored slot suggestions',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'doctorId', in: 'query', schema: { type: 'string' } },
            { name: 'specialisation', in: 'query', schema: { type: 'string' } },
            { name: 'preferredDate', in: 'query', schema: { type: 'string', format: 'date' } },
          ],
          responses: {
            '200': { description: 'Scored slot suggestions', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/ScoredSlot' } } } } },
            '401': { description: 'Unauthorized' },
          },
        },
      },
      '/slots/doctor/{doctorId}': {
        get: {
          tags: ['Slots'],
          summary: 'Get available slots for a specific doctor',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } },
          ],
          responses: {
            '200': { description: 'Available slots', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/TimeSlot' } } } } },
            '401': { description: 'Unauthorized' },
          },
        },
      },
      // ── Appointments ──────────────────────────────────────────────────
      '/appointments': {
        post: {
          tags: ['Appointments'],
          summary: 'Book an appointment (PATIENT only)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAppointmentRequest' } } },
          },
          responses: {
            '201': { description: 'Appointment created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Appointment' } } } },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
            '409': { description: 'Slot no longer available' },
            '422': { description: 'Validation error' },
          },
        },
      },
      '/appointments/my': {
        get: {
          tags: ['Appointments'],
          summary: "Get authenticated patient's appointments (PATIENT only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] } },
          ],
          responses: {
            '200': { description: 'Patient appointments', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Appointment' } } } } },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
          },
        },
      },
      '/appointments/{id}': {
        get: {
          tags: ['Appointments'],
          summary: 'Get appointment by ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Appointment details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Appointment' } } } },
            '401': { description: 'Unauthorized' },
            '404': { description: 'Not found' },
          },
        },
      },
      '/appointments/{id}/status': {
        patch: {
          tags: ['Appointments'],
          summary: 'Update appointment status',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateAppointmentRequest' } } },
          },
          responses: {
            '200': { description: 'Status updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Appointment' } } } },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
            '404': { description: 'Not found' },
            '422': { description: 'Validation error' },
          },
        },
      },
      // ── EHR ───────────────────────────────────────────────────────────
      '/ehr/my': {
        get: {
          tags: ['EHR'],
          summary: "Get authenticated patient's EHR (PATIENT only)",
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'EHR record', content: { 'application/json': { schema: { $ref: '#/components/schemas/EHR' } } } },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
          },
        },
        patch: {
          tags: ['EHR'],
          summary: "Update authenticated patient's EHR (PATIENT only)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateEHRRequest' } } },
          },
          responses: {
            '200': { description: 'EHR updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/EHR' } } } },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
          },
        },
      },
      '/ehr/{patientId}': {
        get: {
          tags: ['EHR'],
          summary: "Get patient's EHR by patientId (DOCTOR or ADMIN only)",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'patientId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'EHR record', content: { 'application/json': { schema: { $ref: '#/components/schemas/EHR' } } } },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
            '404': { description: 'Not found' },
          },
        },
      },
      '/ehr/{patientId}/notes': {
        post: {
          tags: ['EHR'],
          summary: 'Add clinical note to patient EHR (DOCTOR only)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'patientId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AddClinicalNoteRequest' } } },
          },
          responses: {
            '200': { description: 'Note added', content: { 'application/json': { schema: { $ref: '#/components/schemas/EHR' } } } },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
            '422': { description: 'Validation error' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
