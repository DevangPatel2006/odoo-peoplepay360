import Joi from 'joi';

export const loginSchema = Joi.object({
  work_email: Joi.string().email().required().messages({
    'string.email': 'A valid work email is required',
    'any.required': 'Work email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

export const changePasswordSchema = Joi.object({
  old_password: Joi.string().required(),
  new_password: Joi.string().min(6).required(),
});

export default {
  loginSchema,
  changePasswordSchema,
};
