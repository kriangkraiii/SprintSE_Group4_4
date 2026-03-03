const Joi = require('joi');

const checkPositionSchema = Joi.object({
    bookingId: Joi.string().required(),
    lat: Joi.number().min(-90).max(90).required(),
    lon: Joi.number().min(-180).max(180).required(),
});

const manualTriggerSchema = Joi.object({
    bookingId: Joi.string().required(),
});

module.exports = {
    checkPositionSchema,
    manualTriggerSchema,
};
