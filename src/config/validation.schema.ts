import * as Joi from 'joi';

export const validationSchema = Joi.object({
  RSS_URL: Joi.string().required(),
  NODEMAILER_USER: Joi.string().required(),
  NODEMAILER_PASS: Joi.string().required(),
  PUSHCUT_URL: Joi.string().required(),
  OPENAI_KEY: Joi.string().required(),
  PROPOSAL: Joi.string().default(
    "\nI'm one of the few top-rated plus freelancers from the Philippines. I have solid experience working with MERN stack especially here in upwork on high-value clients. I have a passion for delivering high-quality products that make an impact on humans. Here is a summary of my freelance work here on Upwork.\n\n1. roq.ai (current) - I'm a senior full-stack developer with our stack NestJS graphql backend and React frontend. We started as a large team of 16 developers and we're left with 4 developers for a large project. My largest contribution to the projects is the authentication, authorization, and notification services. Our authentication service works like auth0 and we have a unique authorization solution that I implemented. Our notification services involve sending to different channels - email, text messages, in-app and push notifications.\n\n2. privateauto.com - My role is a senior full-stack developer who was also the lead backend developer of the team. I worked on a lot of 3rd party integrations namely - stripe for payments, shipping, social logins (google, apple), vin data vehicle reports and other core features of the app.\n\n2. https://www.appraisalinbox.com/- platform for appraisers to manage appraisals, contact teams and generate reports and insights. I was initial and only engineer who worked on the front-end from the ground up until its first production release.\n\n3. https://www.clubee.com/ - a platform for sports organizations to manage events, members and websites. I worked as a frontend engineer using react, typescript, mui, nextjs,\n\nI'm currently looking for a project with a good product vision that I can help grow and become something big in the future. I have attached my resume for in-depth details of my professional background.\n\nYou can check some of my code examples and public projects here:\n\nrecent\n- https://github.com/jasper95/mongodb-api\n- https://github.com/jasper95/c-farms\nold\n- https://github.com/jasper95/cenvi-api\n- https://github.com/jasper95/cenvi\n",
  ),
});
