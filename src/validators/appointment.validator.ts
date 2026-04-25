import Joi from 'joi';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const createAppointmentSchema = Joi.object({
  slotId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'slotId must be a valid ObjectId',
  }),
  doctorId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'doctorId must be a valid ObjectId',
  }),
  type: Joi.string().valid('IN_PERSON', 'TELEMEDICINE').default('IN_PERSON'),
  notes: Joi.string().max(500).optional(),
});

export const updateAppointmentSchema = Joi.object({
  status: Joi.string().valid('CONFIRMED', 'CANCELLED', 'COMPLETED').required(),
  cancelReason: Joi.string().when('status', {
    is: 'CANCELLED',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});
