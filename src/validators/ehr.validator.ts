import Joi from 'joi';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const addClinicalNoteSchema = Joi.object({
  note: Joi.string().min(10).max(2000).required(),
});

export const updateEHRSchema = Joi.object({
  allergies: Joi.array().items(Joi.string()).optional(),
  chronicConditions: Joi.array().items(Joi.string()).optional(),
  currentMedications: Joi.array().items(Joi.string()).optional(),
  bloodGroup: Joi.string().valid(...bloodGroups).optional(),
});
