import Joi from 'joi';

export const setAvailabilitySchema = Joi.object({
  slots: Joi.array()
    .items(
      Joi.object({
        startTime: Joi.string().isoDate().required().custom((value, helpers) => {
          if (new Date(value) <= new Date()) {
            return helpers.error('date.future');
          }
          return value;
        }).messages({ 'date.future': 'startTime must be in the future' }),
        endTime: Joi.string().isoDate().required(),
        durationMinutes: Joi.number().min(15).max(120).default(30),
      })
    )
    .min(1)
    .required(),
});
