import { registerAs } from '@nestjs/config';

export const applicationConfig = registerAs('application', () => ({
  rssUrl: process.env.RSS_URL,
  recipientEmails: process.env.RECIPIENT_EMAILS?.split(','),
  nodemailer: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
  },
  pushcutUrl: process.env.PUSHCUT_URL,
  openaiKey: process.env.OPENAI_KEY,
  previousProposal: process.env.PROPOSAL,
}));
