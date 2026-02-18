const Joi = require('joi');

const registerSchema = Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    nationalIdNumber: Joi.string().required(),
    nationalIdPhoto: Joi.any(),
    selfiePhoto: Joi.any(),
});

const loginSchema = Joi.object({
    username: Joi.string(),
    email: Joi.string().email(),
    password: Joi.string().required(),
}).xor('username', 'email');

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
});

const verifyOtpSchema = Joi.object({
    email: Joi.string().email().required(),
    otpCode: Joi.string().required(),
});

const resetPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    otpCode: Joi.string().required(),
    newPassword: Joi.string().required().min(8),
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required().min(8),
});

module.exports = {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    verifyOtpSchema,
    resetPasswordSchema,
    changePasswordSchema,
};