import Joi from 'joi';

const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/;
const phonePattern = /^\+?[\d\s\-().]{7,20}$/;
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const registerSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string()
    .min(8)
    .pattern(passwordPattern)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&)',
    }),
  role: Joi.string().valid('PATIENT', 'DOCTOR').required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  dateOfBirth: Joi.date()
    .max('now')
    .when('role', { is: 'PATIENT', then: Joi.required(), otherwise: Joi.optional() }),
  contactNumber: Joi.string().pattern(phonePattern).required(),
  specialisation: Joi.string().when('role', {
    is: 'DOCTOR',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  licenseNumber: Joi.string().when('role', {
    is: 'DOCTOR',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  consultationFee: Joi.number().min(0).when('role', {
    is: 'DOCTOR',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export { objectIdPattern };
