import * as Joi from 'joi';

export const validationSchema = Joi.object({
  RSS_URL: Joi.string().required(),
  NODEMAILER_USER: Joi.string().required(),
  NODEMAILER_PASS: Joi.string().required(),
  PUSHCUT_URL: Joi.string().required(),
});
