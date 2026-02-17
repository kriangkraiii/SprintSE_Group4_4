const Joi = require('joi');

const idParamSchema = Joi.object({
    id: Joi.string().required(), // Adjusted parameter name to 'id' to match common express usage or check route definition
});

const createUserSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])/).message('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร ประกอบด้วย A-Z, a-z และ 0-9').required(),
    username: Joi.string().allow('', null),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').allow('', null),
    nationalIdNumber: Joi.string().required(),
    nationalIdExpiryDate: Joi.string().allow('', null),
    nationalIdBackNumber: Joi.string().allow('', null),
    nationalIdOcrData: Joi.string().allow('', null),
    verifiedByOcr: Joi.string().valid('true', 'false').allow('', null),
    role: Joi.string().valid('PASSENGER', 'DRIVER', 'ADMIN').default('PASSENGER'),
});

const updateMyProfileSchema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    phoneNumber: Joi.string(),
    email: Joi.string().email(),
});

const updateUserByAdminSchema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    phoneNumber: Joi.string(),
    email: Joi.string().email(),
    role: Joi.string().valid('PASSENGER', 'DRIVER', 'ADMIN'),
    isActive: Joi.boolean(),
    isVerified: Joi.boolean(),
});

const updateUserStatusSchema = Joi.object({
    isActive: Joi.boolean(),
    isVerified: Joi.boolean(),
});

const listUsersQuerySchema = Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1),
    q: Joi.string().allow('', null),
    role: Joi.string(),
    search: Joi.string().allow('', null),
    isActive: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '')).allow(null),
    isVerified: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '')).allow(null),
    createdFrom: Joi.string().allow('', null),
    createdTo: Joi.string().allow('', null),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'email', 'firstName', 'lastName').allow('', null),
    sortOrder: Joi.string().valid('asc', 'desc').allow('', null),
});

module.exports = {
    idParamSchema,
    createUserSchema,
    updateMyProfileSchema,
    updateUserByAdminSchema,
    updateUserStatusSchema,
    listUsersQuerySchema,
};