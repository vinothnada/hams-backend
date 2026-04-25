import Joi from 'joi';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const getSlotsQuerySchema = Joi.object({
  doctorId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'doctorId must be a valid ObjectId',
  }),
  date: Joi.string().isoDate().optional(),
  specialisation: Joi.string().optional(),
});
