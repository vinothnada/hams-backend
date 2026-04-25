import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hams';
const PASSWORD = 'User@1234';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

// Seed window: 1 Apr 2026 – 30 May 2026.  "Today" for demo = 25 Apr 2026.
const SEED_START = new Date(2026, 3, 1);
const SEED_END   = new Date(2026, 4, 30);
const TODAY      = new Date(2026, 3, 25);

// ── Inline schemas ─────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role:         { type: String, enum: ['PATIENT', 'DOCTOR', 'ADMIN'], required: true },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

const patientSchema = new mongoose.Schema(
  {
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    firstName:     { type: String, required: true },
    lastName:      { type: String, required: true },
    dateOfBirth:   { type: Date, required: true },
    contactNumber: { type: String, required: true },
    insuranceId:   String,
    address:       String,
    bloodGroup:    { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    allergies:     { type: [String], default: [] },
  },
  { timestamps: true }
);

const doctorSchema = new mongoose.Schema(
  {
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    firstName:       { type: String, required: true },
    lastName:        { type: String, required: true },
    specialisation:  { type: String, required: true },
    licenseNumber:   { type: String, required: true, unique: true },
    contactNumber:   { type: String, required: true },
    bio:             String,
    consultationFee: { type: Number, required: true, min: 0 },
    isAvailable:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

const timeSlotSchema = new mongoose.Schema(
  {
    doctorId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    startTime:       { type: Date, required: true },
    endTime:         { type: Date, required: true },
    durationMinutes: { type: Number, default: 30, min: 15 },
    isAvailable:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

const appointmentSchema = new mongoose.Schema(
  {
    patientId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor',  required: true },
    slotId:       { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
    status:       { type: String, enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], default: 'PENDING' },
    type:         { type: String, enum: ['IN_PERSON', 'TELEMEDICINE'], required: true },
    notes:        { type: String, maxlength: 500 },
    cancelReason: String,
  },
  { timestamps: true }
);

const ehrSchema = new mongoose.Schema(
  {
    patientId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, unique: true },
    bloodGroup:         { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    allergies:          { type: [String], default: [] },
    chronicConditions:  { type: [String], default: [] },
    currentMedications: { type: [String], default: [] },
    clinicalNotes: [
      {
        doctorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
        note:      { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const User        = mongoose.model('User',        userSchema);
const Patient     = mongoose.model('Patient',     patientSchema);
const Doctor      = mongoose.model('Doctor',      doctorSchema);
const TimeSlot    = mongoose.model('TimeSlot',    timeSlotSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);
const EHR         = mongoose.model('EHR',         ehrSchema);

// ── Doctor data (10) ───────────────────────────────────────────────────────────

const doctorData = [
  { email: 'dr.alice.chen@hams.com',      firstName: 'Alice',    lastName: 'Chen',      specialisation: 'Cardiology',       licenseNumber: 'LIC-DOC-001', contactNumber: '+1-555-001-0001', consultationFee: 200, bio: 'Board-certified cardiologist with 15 years of experience in interventional cardiology.' },
  { email: 'dr.james.patel@hams.com',     firstName: 'James',    lastName: 'Patel',     specialisation: 'General Practice', licenseNumber: 'LIC-DOC-002', contactNumber: '+1-555-001-0002', consultationFee: 120, bio: 'Family medicine physician focused on preventive care and chronic disease management.' },
  { email: 'dr.sofia.gomez@hams.com',     firstName: 'Sofia',    lastName: 'Gomez',     specialisation: 'Dermatology',      licenseNumber: 'LIC-DOC-003', contactNumber: '+1-555-001-0003', consultationFee: 150, bio: 'Dermatologist specialising in skin disorders, cosmetic procedures, and skin cancer screening.' },
  { email: 'dr.michael.thompson@hams.com',firstName: 'Michael',  lastName: 'Thompson',  specialisation: 'Neurology',        licenseNumber: 'LIC-DOC-004', contactNumber: '+1-555-001-0004', consultationFee: 220, bio: 'Neurologist with expertise in headache disorders, epilepsy, and movement disorders.' },
  { email: 'dr.priya.sharma@hams.com',    firstName: 'Priya',    lastName: 'Sharma',    specialisation: 'Paediatrics',      licenseNumber: 'LIC-DOC-005', contactNumber: '+1-555-001-0005', consultationFee: 130, bio: 'Paediatrician dedicated to child health from newborns through adolescence.' },
  { email: 'dr.robert.williams@hams.com', firstName: 'Robert',   lastName: 'Williams',  specialisation: 'Orthopaedics',     licenseNumber: 'LIC-DOC-006', contactNumber: '+1-555-001-0006', consultationFee: 180, bio: 'Orthopaedic surgeon specialising in joint replacement and sports medicine injuries.' },
  { email: 'dr.jennifer.lee@hams.com',    firstName: 'Jennifer', lastName: 'Lee',       specialisation: 'Oncology',         licenseNumber: 'LIC-DOC-007', contactNumber: '+1-555-001-0007', consultationFee: 250, bio: 'Oncologist specialising in breast and gastrointestinal cancers with 12 years of clinical practice.' },
  { email: 'dr.david.martinez@hams.com',  firstName: 'David',    lastName: 'Martinez',  specialisation: 'Endocrinology',    licenseNumber: 'LIC-DOC-008', contactNumber: '+1-555-001-0008', consultationFee: 190, bio: 'Endocrinologist focused on diabetes management, thyroid disorders, and hormonal conditions.' },
  { email: 'dr.sarah.johnson@hams.com',   firstName: 'Sarah',    lastName: 'Johnson',   specialisation: 'Psychiatry',       licenseNumber: 'LIC-DOC-009', contactNumber: '+1-555-001-0009', consultationFee: 175, bio: 'Psychiatrist providing evidence-based treatment for mood disorders, anxiety, and PTSD.' },
  { email: 'dr.kevin.brown@hams.com',     firstName: 'Kevin',    lastName: 'Brown',     specialisation: 'Gastroenterology', licenseNumber: 'LIC-DOC-010', contactNumber: '+1-555-001-0010', consultationFee: 210, bio: 'Gastroenterologist with expertise in IBD, liver disease, and advanced endoscopy.' },
];

// ── Patient data (50) ──────────────────────────────────────────────────────────

const patientData = [
  { email: 'patient.noah.kim@hams.com',         firstName: 'Noah',      lastName: 'Kim',       dateOfBirth: new Date(1990, 2, 15),  contactNumber: '+1-555-002-0001', bloodGroup: 'A+' as const,  address: '12 Maple St, Boston, MA',             insuranceId: 'INS-100001', allergies: ['Penicillin'] },
  { email: 'patient.emma.jones@hams.com',        firstName: 'Emma',      lastName: 'Jones',     dateOfBirth: new Date(1985, 6, 22),  contactNumber: '+1-555-002-0002', bloodGroup: 'O-' as const,  address: '45 Oak Ave, Chicago, IL',             insuranceId: 'INS-100002', allergies: ['Sulfa drugs', 'Latex'] },
  { email: 'patient.liam.brown@hams.com',        firstName: 'Liam',      lastName: 'Brown',     dateOfBirth: new Date(1978, 10, 5),  contactNumber: '+1-555-002-0003', bloodGroup: 'B+' as const,  address: '78 Pine Rd, Houston, TX',             insuranceId: 'INS-100003', allergies: [] },
  { email: 'patient.olivia.davis@hams.com',      firstName: 'Olivia',    lastName: 'Davis',     dateOfBirth: new Date(2000, 0, 30),  contactNumber: '+1-555-002-0004', bloodGroup: 'AB+' as const, address: '9 Cedar Blvd, Seattle, WA',           insuranceId: undefined,    allergies: ['Aspirin'] },
  { email: 'patient.william.white@hams.com',     firstName: 'William',   lastName: 'White',     dateOfBirth: new Date(1965, 8, 18),  contactNumber: '+1-555-002-0005', bloodGroup: 'O+' as const,  address: '33 Birch Ln, Miami, FL',              insuranceId: 'INS-100005', allergies: [] },
  { email: 'patient.ava.wilson@hams.com',        firstName: 'Ava',       lastName: 'Wilson',    dateOfBirth: new Date(1992, 3, 12),  contactNumber: '+1-555-002-0006', bloodGroup: 'A+' as const,  address: '61 Elm St, Phoenix, AZ',              insuranceId: 'INS-100006', allergies: ['NSAIDs'] },
  { email: 'patient.james.moore@hams.com',       firstName: 'James',     lastName: 'Moore',     dateOfBirth: new Date(1973, 7, 25),  contactNumber: '+1-555-002-0007', bloodGroup: 'B-' as const,  address: '14 Walnut Ave, Philadelphia, PA',     insuranceId: 'INS-100007', allergies: [] },
  { email: 'patient.isabella.taylor@hams.com',   firstName: 'Isabella',  lastName: 'Taylor',    dateOfBirth: new Date(1988, 11, 3),  contactNumber: '+1-555-002-0008', bloodGroup: 'AB-' as const, address: '27 Spruce Dr, San Antonio, TX',       insuranceId: 'INS-100008', allergies: ['Codeine'] },
  { email: 'patient.oliver.anderson@hams.com',   firstName: 'Oliver',    lastName: 'Anderson',  dateOfBirth: new Date(1995, 5, 17),  contactNumber: '+1-555-002-0009', bloodGroup: 'O+' as const,  address: '5 Redwood Ct, San Diego, CA',         insuranceId: undefined,    allergies: [] },
  { email: 'patient.sophia.thomas@hams.com',     firstName: 'Sophia',    lastName: 'Thomas',    dateOfBirth: new Date(1961, 1, 28),  contactNumber: '+1-555-002-0010', bloodGroup: 'A-' as const,  address: '88 Magnolia Dr, Dallas, TX',          insuranceId: 'INS-100010', allergies: ['Penicillin', 'Aspirin'] },
  { email: 'patient.benjamin.jackson@hams.com',  firstName: 'Benjamin',  lastName: 'Jackson',   dateOfBirth: new Date(1983, 9, 9),   contactNumber: '+1-555-002-0011', bloodGroup: 'B+' as const,  address: '3 Willow Way, San Jose, CA',          insuranceId: 'INS-100011', allergies: [] },
  { email: 'patient.charlotte.harris@hams.com',  firstName: 'Charlotte', lastName: 'Harris',    dateOfBirth: new Date(1970, 4, 14),  contactNumber: '+1-555-002-0012', bloodGroup: 'O+' as const,  address: '52 Aspen Rd, Austin, TX',             insuranceId: 'INS-100012', allergies: ['Shellfish'] },
  { email: 'patient.elijah.martin@hams.com',     firstName: 'Elijah',    lastName: 'Martin',    dateOfBirth: new Date(1998, 6, 20),  contactNumber: '+1-555-002-0013', bloodGroup: 'A+' as const,  address: '19 Poplar St, Jacksonville, FL',      insuranceId: undefined,    allergies: [] },
  { email: 'patient.amelia.garcia@hams.com',     firstName: 'Amelia',    lastName: 'Garcia',    dateOfBirth: new Date(1956, 2, 8),   contactNumber: '+1-555-002-0014', bloodGroup: 'AB+' as const, address: '74 Sycamore Ln, San Francisco, CA',   insuranceId: 'INS-100014', allergies: ['Latex', 'Penicillin'] },
  { email: 'patient.lucas.martinez@hams.com',    firstName: 'Lucas',     lastName: 'Martinez',  dateOfBirth: new Date(1986, 10, 30), contactNumber: '+1-555-002-0015', bloodGroup: 'O-' as const,  address: '36 Chestnut Ave, Columbus, OH',       insuranceId: 'INS-100015', allergies: [] },
  { email: 'patient.mia.rodriguez@hams.com',     firstName: 'Mia',       lastName: 'Rodriguez', dateOfBirth: new Date(2002, 8, 15),  contactNumber: '+1-555-002-0016', bloodGroup: 'B+' as const,  address: '11 Hickory Blvd, Charlotte, NC',      insuranceId: undefined,    allergies: ['NSAIDs'] },
  { email: 'patient.mason.lewis@hams.com',       firstName: 'Mason',     lastName: 'Lewis',     dateOfBirth: new Date(1968, 3, 22),  contactNumber: '+1-555-002-0017', bloodGroup: 'A+' as const,  address: '47 Locust St, Indianapolis, IN',      insuranceId: 'INS-100017', allergies: [] },
  { email: 'patient.harper.lee@hams.com',        firstName: 'Harper',    lastName: 'Lee',       dateOfBirth: new Date(1979, 0, 7),   contactNumber: '+1-555-002-0018', bloodGroup: 'O+' as const,  address: '23 Dogwood Dr, Portland, OR',         insuranceId: 'INS-100018', allergies: ['Sulfa drugs'] },
  { email: 'patient.logan.walker@hams.com',      firstName: 'Logan',     lastName: 'Walker',    dateOfBirth: new Date(1994, 7, 18),  contactNumber: '+1-555-002-0019', bloodGroup: 'B-' as const,  address: '68 Cypress Ct, Denver, CO',           insuranceId: 'INS-100019', allergies: [] },
  { email: 'patient.evelyn.hall@hams.com',       firstName: 'Evelyn',    lastName: 'Hall',      dateOfBirth: new Date(1963, 11, 25), contactNumber: '+1-555-002-0020', bloodGroup: 'AB+' as const, address: '4 Laurel Way, Nashville, TN',         insuranceId: 'INS-100020', allergies: ['Aspirin'] },
  { email: 'patient.alexander.allen@hams.com',   firstName: 'Alexander', lastName: 'Allen',     dateOfBirth: new Date(1945, 4, 10),  contactNumber: '+1-555-002-0021', bloodGroup: 'O+' as const,  address: '55 Fir St, Boston, MA',               insuranceId: 'INS-100021', allergies: ['Penicillin'] },
  { email: 'patient.abigail.young@hams.com',     firstName: 'Abigail',   lastName: 'Young',     dateOfBirth: new Date(1989, 8, 2),   contactNumber: '+1-555-002-0022', bloodGroup: 'A+' as const,  address: '30 Beech Blvd, Chicago, IL',          insuranceId: 'INS-100022', allergies: [] },
  { email: 'patient.ethan.hernandez@hams.com',   firstName: 'Ethan',     lastName: 'Hernandez', dateOfBirth: new Date(1975, 2, 19),  contactNumber: '+1-555-002-0023', bloodGroup: 'B+' as const,  address: '17 Hazel Ave, Houston, TX',           insuranceId: undefined,    allergies: ['Codeine', 'Shellfish'] },
  { email: 'patient.emily.king@hams.com',        firstName: 'Emily',     lastName: 'King',      dateOfBirth: new Date(1999, 10, 11), contactNumber: '+1-555-002-0024', bloodGroup: 'O-' as const,  address: '82 Mulberry Rd, Seattle, WA',         insuranceId: 'INS-100024', allergies: [] },
  { email: 'patient.daniel.wright@hams.com',     firstName: 'Daniel',    lastName: 'Wright',    dateOfBirth: new Date(1958, 6, 4),   contactNumber: '+1-555-002-0025', bloodGroup: 'AB+' as const, address: '29 Plum St, Miami, FL',               insuranceId: 'INS-100025', allergies: ['NSAIDs', 'Aspirin'] },
  { email: 'patient.elizabeth.lopez@hams.com',   firstName: 'Elizabeth', lastName: 'Lopez',     dateOfBirth: new Date(1982, 1, 16),  contactNumber: '+1-555-002-0026', bloodGroup: 'A-' as const,  address: '41 Peach Blvd, Phoenix, AZ',          insuranceId: 'INS-100026', allergies: [] },
  { email: 'patient.henry.hill@hams.com',        firstName: 'Henry',     lastName: 'Hill',      dateOfBirth: new Date(1971, 5, 28),  contactNumber: '+1-555-002-0027', bloodGroup: 'O+' as const,  address: '7 Pear Ct, Philadelphia, PA',         insuranceId: 'INS-100027', allergies: ['Penicillin'] },
  { email: 'patient.mila.scott@hams.com',        firstName: 'Mila',      lastName: 'Scott',     dateOfBirth: new Date(1997, 9, 5),   contactNumber: '+1-555-002-0028', bloodGroup: 'B-' as const,  address: '63 Cherry Dr, San Antonio, TX',       insuranceId: undefined,    allergies: [] },
  { email: 'patient.jackson.green@hams.com',     firstName: 'Jackson',   lastName: 'Green',     dateOfBirth: new Date(1953, 7, 13),  contactNumber: '+1-555-002-0029', bloodGroup: 'AB-' as const, address: '38 Apricot Ln, San Diego, CA',        insuranceId: 'INS-100029', allergies: ['Sulfa drugs'] },
  { email: 'patient.ella.adams@hams.com',        firstName: 'Ella',      lastName: 'Adams',     dateOfBirth: new Date(1987, 3, 30),  contactNumber: '+1-555-002-0030', bloodGroup: 'A+' as const,  address: '56 Grape St, Dallas, TX',             insuranceId: 'INS-100030', allergies: [] },
  { email: 'patient.sebastian.baker@hams.com',   firstName: 'Sebastian', lastName: 'Baker',     dateOfBirth: new Date(1977, 11, 21), contactNumber: '+1-555-002-0031', bloodGroup: 'O+' as const,  address: '92 Melon Ave, San Jose, CA',          insuranceId: 'INS-100031', allergies: ['Latex'] },
  { email: 'patient.avery.nelson@hams.com',      firstName: 'Avery',     lastName: 'Nelson',    dateOfBirth: new Date(2001, 2, 9),   contactNumber: '+1-555-002-0032', bloodGroup: 'B+' as const,  address: '15 Berry Blvd, Austin, TX',           insuranceId: undefined,    allergies: [] },
  { email: 'patient.aiden.carter@hams.com',      firstName: 'Aiden',     lastName: 'Carter',    dateOfBirth: new Date(1966, 8, 17),  contactNumber: '+1-555-002-0033', bloodGroup: 'A+' as const,  address: '44 Lemon Rd, Jacksonville, FL',       insuranceId: 'INS-100033', allergies: ['Aspirin', 'NSAIDs'] },
  { email: 'patient.sofia.mitchell@hams.com',    firstName: 'Sofia',     lastName: 'Mitchell',  dateOfBirth: new Date(1991, 6, 24),  contactNumber: '+1-555-002-0034', bloodGroup: 'O-' as const,  address: '71 Lime Ct, San Francisco, CA',       insuranceId: 'INS-100034', allergies: [] },
  { email: 'patient.matthew.perez@hams.com',     firstName: 'Matthew',   lastName: 'Perez',     dateOfBirth: new Date(1984, 0, 13),  contactNumber: '+1-555-002-0035', bloodGroup: 'AB+' as const, address: '26 Orange Ln, Columbus, OH',          insuranceId: 'INS-100035', allergies: ['Penicillin'] },
  { email: 'patient.camila.roberts@hams.com',    firstName: 'Camila',    lastName: 'Roberts',   dateOfBirth: new Date(1959, 4, 7),   contactNumber: '+1-555-002-0036', bloodGroup: 'B+' as const,  address: '83 Tangerine St, Charlotte, NC',      insuranceId: 'INS-100036', allergies: ['Codeine'] },
  { email: 'patient.samuel.turner@hams.com',     firstName: 'Samuel',    lastName: 'Turner',    dateOfBirth: new Date(1993, 10, 29), contactNumber: '+1-555-002-0037', bloodGroup: 'O+' as const,  address: '49 Blueberry Ave, Indianapolis, IN',  insuranceId: undefined,    allergies: [] },
  { email: 'patient.aria.phillips@hams.com',     firstName: 'Aria',      lastName: 'Phillips',  dateOfBirth: new Date(1976, 7, 14),  contactNumber: '+1-555-002-0038', bloodGroup: 'A-' as const,  address: '10 Strawberry Blvd, Portland, OR',   insuranceId: 'INS-100038', allergies: ['Sulfa drugs', 'Latex'] },
  { email: 'patient.david.campbell@hams.com',    firstName: 'David',     lastName: 'Campbell',  dateOfBirth: new Date(1948, 1, 3),   contactNumber: '+1-555-002-0039', bloodGroup: 'B-' as const,  address: '67 Raspberry Ct, Denver, CO',         insuranceId: 'INS-100039', allergies: ['Aspirin'] },
  { email: 'patient.scarlett.parker@hams.com',   firstName: 'Scarlett',  lastName: 'Parker',    dateOfBirth: new Date(2003, 5, 20),  contactNumber: '+1-555-002-0040', bloodGroup: 'A+' as const,  address: '31 Blackberry Rd, Nashville, TN',     insuranceId: undefined,    allergies: [] },
  { email: 'patient.joseph.evans@hams.com',      firstName: 'Joseph',    lastName: 'Evans',     dateOfBirth: new Date(1969, 9, 8),   contactNumber: '+1-555-002-0041', bloodGroup: 'O+' as const,  address: '77 Cranberry Ln, Boston, MA',         insuranceId: 'INS-100041', allergies: ['Penicillin'] },
  { email: 'patient.victoria.edwards@hams.com',  firstName: 'Victoria',  lastName: 'Edwards',   dateOfBirth: new Date(1980, 3, 15),  contactNumber: '+1-555-002-0042', bloodGroup: 'AB+' as const, address: '22 Gooseberry St, Chicago, IL',       insuranceId: 'INS-100042', allergies: [] },
  { email: 'patient.carter.collins@hams.com',    firstName: 'Carter',    lastName: 'Collins',   dateOfBirth: new Date(1996, 6, 3),   contactNumber: '+1-555-002-0043', bloodGroup: 'B+' as const,  address: '58 Boysenberry Dr, Houston, TX',      insuranceId: undefined,    allergies: ['NSAIDs'] },
  { email: 'patient.madison.stewart@hams.com',   firstName: 'Madison',   lastName: 'Stewart',   dateOfBirth: new Date(1955, 11, 19), contactNumber: '+1-555-002-0044', bloodGroup: 'O-' as const,  address: '95 Elderberry Blvd, Seattle, WA',     insuranceId: 'INS-100044', allergies: ['Aspirin', 'Codeine'] },
  { email: 'patient.owen.sanchez@hams.com',      firstName: 'Owen',      lastName: 'Sanchez',   dateOfBirth: new Date(1985, 8, 27),  contactNumber: '+1-555-002-0045', bloodGroup: 'A+' as const,  address: '40 Currant Ave, Miami, FL',           insuranceId: 'INS-100045', allergies: [] },
  { email: 'patient.luna.morris@hams.com',       firstName: 'Luna',      lastName: 'Morris',    dateOfBirth: new Date(2004, 0, 14),  contactNumber: '+1-555-002-0046', bloodGroup: 'AB-' as const, address: '13 Dewberry St, Phoenix, AZ',         insuranceId: undefined,    allergies: [] },
  { email: 'patient.wyatt.rogers@hams.com',      firstName: 'Wyatt',     lastName: 'Rogers',    dateOfBirth: new Date(1962, 4, 31),  contactNumber: '+1-555-002-0047', bloodGroup: 'O+' as const,  address: '86 Gooseberry Ct, Philadelphia, PA',  insuranceId: 'INS-100047', allergies: ['Penicillin', 'Sulfa drugs'] },
  { email: 'patient.grace.reed@hams.com',        firstName: 'Grace',     lastName: 'Reed',      dateOfBirth: new Date(1990, 7, 8),   contactNumber: '+1-555-002-0048', bloodGroup: 'B+' as const,  address: '34 Huckleberry Rd, San Antonio, TX',  insuranceId: 'INS-100048', allergies: [] },
  { email: 'patient.john.cook@hams.com',         firstName: 'John',      lastName: 'Cook',      dateOfBirth: new Date(1974, 2, 23),  contactNumber: '+1-555-002-0049', bloodGroup: 'A+' as const,  address: '69 Juniper Dr, San Diego, CA',        insuranceId: 'INS-100049', allergies: ['NSAIDs'] },
  { email: 'patient.chloe.morgan@hams.com',      firstName: 'Chloe',     lastName: 'Morgan',    dateOfBirth: new Date(1988, 10, 17), contactNumber: '+1-555-002-0050', bloodGroup: 'O+' as const,  address: '51 Kumquat Blvd, Dallas, TX',         insuranceId: undefined,    allergies: ['Latex'] },
];

// ── EHR templates (10, cycled over 50 patients) ───────────────────────────────

const EHR_TEMPLATES = [
  { chronicConditions: ['Hypertension', 'Type 2 Diabetes'],     currentMedications: ['Metformin 500mg BD', 'Lisinopril 10mg OD', 'Aspirin 81mg OD'] },
  { chronicConditions: ['Asthma'],                               currentMedications: ['Salbutamol 100mcg inhaler PRN', 'Fluticasone 100mcg inhaler BD'] },
  { chronicConditions: [],                                        currentMedications: ['Vitamin D 1000IU OD'] },
  { chronicConditions: ['Hypothyroidism'],                       currentMedications: ['Levothyroxine 50mcg OD'] },
  { chronicConditions: ['Hyperlipidaemia', 'Hypertension'],     currentMedications: ['Atorvastatin 20mg ON', 'Amlodipine 5mg OD'] },
  { chronicConditions: ['Depression', 'Anxiety'],               currentMedications: ['Sertraline 50mg OD', 'Alprazolam 0.5mg PRN'] },
  { chronicConditions: ['GERD'],                                 currentMedications: ['Omeprazole 20mg OD'] },
  { chronicConditions: ['Osteoarthritis'],                       currentMedications: ['Paracetamol 1g TDS', 'Naproxen 500mg BD PRN'] },
  { chronicConditions: ['Migraine'],                             currentMedications: ['Sumatriptan 50mg PRN', 'Topiramate 25mg OD'] },
  { chronicConditions: ['Atrial Fibrillation', 'Heart Failure'],currentMedications: ['Warfarin 5mg OD', 'Metoprolol 25mg BD', 'Furosemide 40mg OD'] },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getWorkingDays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= last) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) {
      days.push(new Date(cur.getFullYear(), cur.getMonth(), cur.getDate()));
    }
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

// Slot start times within a working day (8 per day, 30 min each)
const SLOT_TIMES: [number, number][] = [
  [9, 0], [9, 30], [10, 0], [10, 30],
  [11, 0], [14, 0], [14, 30], [15, 0],
];

const CANCEL_REASONS = [
  'Patient requested cancellation',
  'Schedule conflict',
  'Medical emergency – rescheduling required',
  'Doctor unavailable',
  'Patient unable to attend',
];

const APPT_NOTES = [
  'Routine follow-up appointment.',
  'Initial consultation requested by patient.',
  'Follow-up for ongoing condition management.',
  'Annual review appointment.',
  'Referred by primary care physician.',
  'Second opinion consultation.',
  'Post-procedure follow-up visit.',
  'Pre-operative assessment.',
  'Medication review and dose adjustment.',
  'Results review and care plan update.',
];

function clinicalNote(conditions: string[], visitIdx: number): string {
  if (conditions.length === 0) {
    const opts = [
      'Annual health check. All vitals within normal range. BMI 23.4. No new concerns raised. Advised to maintain current healthy lifestyle.',
      'Routine preventive check-up. Blood pressure 118/76 mmHg. CBC and lipid panel normal. Patient reports feeling well. No medications required.',
      'Wellness screen completed. Cholesterol 4.1 mmol/L, fasting glucose normal. ECG shows normal sinus rhythm. Follow-up in 12 months.',
    ];
    return opts[visitIdx % opts.length];
  }
  const c = conditions.join(' and ');
  const opts = [
    `Review of ${c}. Condition stable on current medications. Patient reports good adherence. Vitals within acceptable range. Continue current management plan.`,
    `Follow-up for ${c}. Symptoms well-controlled. Medication side-effects reviewed — none significant. Lifestyle modifications reinforced. Next review in 3 months.`,
    `Ongoing management of ${c}. Repeat investigations reviewed. Results within acceptable parameters. No dose adjustments required at this time. Patient educated on warning signs.`,
    `Monitoring visit for ${c}. Patient reports improved compliance with medication regimen. Referral to specialist discussed. Continue current plan with close monitoring.`,
  ];
  return opts[visitIdx % opts.length];
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Connecting to', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  // ── Clear previous seed data ──
  const allEmails = [...doctorData.map((d) => d.email), ...patientData.map((p) => p.email)];
  const existingUsers = await User.find({ email: { $in: allEmails } }).select('_id');
  const existingUserIds = existingUsers.map((u) => u._id);

  if (existingUserIds.length > 0) {
    const existingDoctors  = await Doctor.find({ userId: { $in: existingUserIds } }).select('_id');
    const existingPatients = await Patient.find({ userId: { $in: existingUserIds } }).select('_id');
    const doctorIds  = existingDoctors.map((d) => d._id);
    const patientIds = existingPatients.map((p) => p._id);

    await TimeSlot.deleteMany({ doctorId: { $in: doctorIds } });
    await Appointment.deleteMany({ $or: [{ doctorId: { $in: doctorIds } }, { patientId: { $in: patientIds } }] });
    await EHR.deleteMany({ patientId: { $in: patientIds } });
    await Doctor.deleteMany({ userId: { $in: existingUserIds } });
    await Patient.deleteMany({ userId: { $in: existingUserIds } });
    await User.deleteMany({ _id: { $in: existingUserIds } });
    console.log('Cleared previous seed data.\n');
  }

  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);

  // ── Create Doctors ──
  console.log('Creating doctors...');
  const createdDoctors: any[] = [];
  for (const d of doctorData) {
    const user    = await User.create({ email: d.email, passwordHash, role: 'DOCTOR' });
    const profile = await Doctor.create({
      userId: user._id, firstName: d.firstName, lastName: d.lastName,
      specialisation: d.specialisation, licenseNumber: d.licenseNumber,
      contactNumber: d.contactNumber, bio: d.bio, consultationFee: d.consultationFee,
    });
    console.log(`  ✓ Dr. ${d.firstName} ${d.lastName} — ${d.specialisation}`);
    createdDoctors.push(profile);
  }

  // ── Create Patients ──
  console.log('\nCreating patients...');
  const createdPatients: any[] = [];
  for (const p of patientData) {
    const user    = await User.create({ email: p.email, passwordHash, role: 'PATIENT' });
    const profile = await Patient.create({
      userId: user._id, firstName: p.firstName, lastName: p.lastName,
      dateOfBirth: p.dateOfBirth, contactNumber: p.contactNumber,
      insuranceId: p.insuranceId, address: p.address,
      bloodGroup: p.bloodGroup, allergies: p.allergies,
    });
    console.log(`  ✓ ${p.firstName} ${p.lastName}`);
    createdPatients.push(profile);
  }

  // ── Create TimeSlots ──
  console.log('\nCreating time slots...');
  const workingDays = getWorkingDays(SEED_START, SEED_END);
  const slotDocs: any[] = [];

  for (const doctor of createdDoctors) {
    for (const day of workingDays) {
      for (const [h, m] of SLOT_TIMES) {
        const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0);
        const end   = new Date(start.getTime() + 30 * 60 * 1000);
        slotDocs.push({
          doctorId: doctor._id,
          startTime: start,
          endTime: end,
          durationMinutes: 30,
          // Past slots are no longer bookable; future slots open by default
          isAvailable: start >= TODAY,
        });
      }
    }
  }

  const insertedSlots = (await TimeSlot.insertMany(slotDocs)) as any[];
  console.log(`  ✓ ${insertedSlots.length} slots across ${workingDays.length} working days for ${createdDoctors.length} doctors`);

  // Build per-doctor slot index split by past / future
  const slotMap: Record<string, { past: any[]; future: any[] }> = {};
  for (const doc of createdDoctors) {
    slotMap[doc._id.toString()] = { past: [], future: [] };
  }
  for (const slot of insertedSlots) {
    const bucket = slot.startTime < TODAY ? 'past' : 'future';
    slotMap[slot.doctorId.toString()][bucket].push(slot);
  }

  // ── Create Appointments ──
  console.log('\nCreating appointments...');
  const appointmentDocs: any[] = [];
  const slotsToBook: mongoose.Types.ObjectId[] = [];

  // Per-patient tracking for EHR notes
  const patientCompletedVisits: Record<string, Array<{ date: Date; doctorId: any }>> = {};

  for (let i = 0; i < createdPatients.length; i++) {
    const patient     = createdPatients[i];
    const pid         = patient._id.toString();
    patientCompletedVisits[pid] = [];

    const primaryDoc    = createdDoctors[i % 10];
    const secondaryDoc  = createdDoctors[(i + 3) % 10];
    const primaryPast   = slotMap[primaryDoc._id.toString()].past;
    const primaryFuture = slotMap[primaryDoc._id.toString()].future;
    const secFuture     = slotMap[secondaryDoc._id.toString()].future;

    // ---- Past appointment 1 ----
    if (primaryPast.length > 0) {
      const slot   = primaryPast[(i * 8) % primaryPast.length];
      const status = i % 4 === 0 ? 'CANCELLED' : 'COMPLETED';
      appointmentDocs.push({
        patientId:    patient._id,
        doctorId:     primaryDoc._id,
        slotId:       slot._id,
        status,
        type:         i % 2 === 0 ? 'IN_PERSON' : 'TELEMEDICINE',
        notes:        APPT_NOTES[(i * 3) % APPT_NOTES.length],
        ...(status === 'CANCELLED' ? { cancelReason: CANCEL_REASONS[i % CANCEL_REASONS.length] } : {}),
      });
      if (status === 'COMPLETED') {
        patientCompletedVisits[pid].push({ date: slot.startTime, doctorId: primaryDoc._id });
      }
    }

    // ---- Past appointment 2 (every 3rd patient) ----
    if (i % 3 === 0 && primaryPast.length > 1) {
      const slot   = primaryPast[(i * 8 + 72) % primaryPast.length];
      const status = i % 5 === 0 ? 'CANCELLED' : 'COMPLETED';
      appointmentDocs.push({
        patientId:    patient._id,
        doctorId:     primaryDoc._id,
        slotId:       slot._id,
        status,
        type:         i % 2 === 1 ? 'IN_PERSON' : 'TELEMEDICINE',
        notes:        APPT_NOTES[(i * 5 + 2) % APPT_NOTES.length],
        ...(status === 'CANCELLED' ? { cancelReason: CANCEL_REASONS[(i + 2) % CANCEL_REASONS.length] } : {}),
      });
      if (status === 'COMPLETED') {
        patientCompletedVisits[pid].push({ date: slot.startTime, doctorId: primaryDoc._id });
      }
    }

    // ---- Future appointment 1 (primary doctor) ----
    if (primaryFuture.length > 0) {
      const slot       = primaryFuture[(i * 6) % primaryFuture.length];
      const statusRoll = (i * 3) % 5;
      const status     = statusRoll < 2 ? 'CONFIRMED' : statusRoll < 4 ? 'PENDING' : 'CANCELLED';
      appointmentDocs.push({
        patientId:    patient._id,
        doctorId:     primaryDoc._id,
        slotId:       slot._id,
        status,
        type:         (i + 1) % 2 === 0 ? 'IN_PERSON' : 'TELEMEDICINE',
        notes:        APPT_NOTES[(i * 7 + 1) % APPT_NOTES.length],
        ...(status === 'CANCELLED' ? { cancelReason: CANCEL_REASONS[(i + 1) % CANCEL_REASONS.length] } : {}),
      });
      if (status !== 'CANCELLED') slotsToBook.push(slot._id);
    }

    // ---- Future appointment 2 (secondary doctor, every 4th patient) ----
    if (i % 4 === 0 && secFuture.length > 0) {
      const slot       = secFuture[(i * 6 + 150) % secFuture.length];
      const statusRoll = (i * 7 + 1) % 5;
      const status     = statusRoll < 2 ? 'CONFIRMED' : statusRoll < 4 ? 'PENDING' : 'CANCELLED';
      appointmentDocs.push({
        patientId:    patient._id,
        doctorId:     secondaryDoc._id,
        slotId:       slot._id,
        status,
        type:         i % 2 === 0 ? 'TELEMEDICINE' : 'IN_PERSON',
        notes:        APPT_NOTES[(i * 9 + 3) % APPT_NOTES.length],
        ...(status === 'CANCELLED' ? { cancelReason: CANCEL_REASONS[(i + 3) % CANCEL_REASONS.length] } : {}),
      });
      if (status !== 'CANCELLED') slotsToBook.push(slot._id);
    }
  }

  await Appointment.insertMany(appointmentDocs);
  console.log(`  ✓ ${appointmentDocs.length} appointments created`);

  // Mark booked future slots as unavailable
  if (slotsToBook.length > 0) {
    await TimeSlot.updateMany({ _id: { $in: slotsToBook } }, { isAvailable: false });
    console.log(`  ✓ ${slotsToBook.length} future slots marked as booked`);
  }

  // ── Create EHR Records ──
  console.log('\nCreating EHR records...');
  for (let i = 0; i < createdPatients.length; i++) {
    const patient   = createdPatients[i];
    const pInfo     = patientData[i];
    const template  = EHR_TEMPLATES[i % EHR_TEMPLATES.length];
    const pid       = patient._id.toString();
    const visits    = patientCompletedVisits[pid] || [];

    const clinicalNotes = visits.map((v, idx) => ({
      doctorId:  v.doctorId,
      note:      clinicalNote(template.chronicConditions, idx),
      createdAt: v.date,
    }));

    // Every patient has at least one clinical note
    if (clinicalNotes.length === 0) {
      clinicalNotes.push({
        doctorId:  createdDoctors[i % 10]._id,
        note:      clinicalNote(template.chronicConditions, 0),
        createdAt: new Date(2026, 3, 5 + (i % 14)),
      });
    }

    await EHR.create({
      patientId:          patient._id,
      bloodGroup:         pInfo.bloodGroup,
      allergies:          pInfo.allergies,
      chronicConditions:  template.chronicConditions,
      currentMedications: template.currentMedications,
      clinicalNotes,
      lastUpdated:        new Date(2026, 3, 24),
    });
    console.log(`  ✓ EHR for ${pInfo.firstName} ${pInfo.lastName}`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const totalSlots    = insertedSlots.length;
  const pastSlots     = insertedSlots.filter((s: any) => s.startTime < TODAY).length;
  const futureSlots   = totalSlots - pastSlots;
  const bookedFuture  = slotsToBook.length;

  console.log('\n══════════════════════════════════════════════════════');
  console.log('Seed complete.  Password for all accounts: User@1234');
  console.log('══════════════════════════════════════════════════════');
  console.log(`\nDoctors (${createdDoctors.length}):`);
  doctorData.forEach((d) => console.log(`  ${d.email}`));
  console.log(`\nPatients (${patientData.length}):`);
  patientData.forEach((p) => console.log(`  ${p.email}`));
  console.log(`\nTime slots : ${totalSlots} total  (${pastSlots} past / ${futureSlots} future, ${bookedFuture} future booked)`);
  console.log(`Appointments: ${appointmentDocs.length}`);
  console.log(`EHR records : ${createdPatients.length}`);
  console.log('══════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
