const Joi = require('joi');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');

/**
 * ตรวจว่า schema เป็น Zod หรือไม่ (มี safeParse method)
 */
const isZodSchema = (schema) => schema && typeof schema.safeParse === 'function';

const validate = (schema) => (req, res, next) => {
    const validSchema = pick(schema, ['params', 'query', 'body']);

    // Express 5: req.query/params/body อาจเป็น getter (ไม่ใช่ own property)
    // จึงใช้ direct access แทน pick() เพื่อให้อ่านค่าได้ถูกต้อง
    const object = {};
    for (const key of Object.keys(validSchema)) {
        object[key] = req[key] ?? {};
    }

    // ตรวจว่ามี Zod schema อยู่ใน validSchema หรือไม่
    const hasZod = Object.values(validSchema).some(isZodSchema);

    if (hasZod) {
        // ── Zod validation path ──
        const errors = [];
        for (const [key, zodSchema] of Object.entries(validSchema)) {
            if (!zodSchema) continue;
            if (!isZodSchema(zodSchema)) {
                // Joi schema ผสมใน request เดียวกัน → ใช้ Joi validate ปกติ
                const { value, error } = zodSchema.validate(object[key]);
                if (error) {
                    errors.push(...error.details.map(d => d.message));
                } else {
                    req[key] = value;
                }
                continue;
            }
            const result = zodSchema.safeParse(object[key]);
            if (!result.success) {
                errors.push(...result.error.errors.map(e => e.message));
            } else {
                req[key] = result.data; // apply coerced/default values
            }
        }
        if (errors.length) {
            return next(new ApiError(400, errors.join(', ')));
        }
        return next();
    }

    // ── Joi validation path (legacy) ──
    const { value, error } = Joi.compile(validSchema)
        .prefs({ errors: { label: 'key' }, abortEarly: false })
        .validate(object);

    if (error) {
        const errorMessage = error.details.map((details) => details.message).join(', ');
        return next(new ApiError(400, errorMessage));
    }
    // Express 5: req.query/params/body เป็น getter — ต้อง assign ทีละ key
    for (const key of Object.keys(value)) {
        req[key] = value[key];
    }
    return next();
};

module.exports = validate;