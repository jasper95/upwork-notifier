import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { applicationConfig } from './config';
import * as xml2js from 'xml2js';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import OpenAI from 'openai';

@Injectable()
export class AppService {
  private transporter: nodemailer.Transporter;
  private openai: OpenAI;
  constructor(
    @Inject(applicationConfig.KEY)
    private readonly appConfig: ConfigType<typeof applicationConfig>,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.appConfig.nodemailer.user,
        pass: this.appConfig.nodemailer.pass,
      },
    });
    this.openai = new OpenAI({
      apiKey: this.appConfig.openaiKey,
    });
  }

  private latestJob;
  private lastGeneratedProposal;

  private readonly logger = new Logger(AppService.name);

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    try {
      const response = await fetch(this.appConfig.rssUrl);
      const xmlData = await response.text();
      const data = await xml2js.parseStringPromise(xmlData, {
        mergeAttrs: true,
        explicitArray: false,
      });

      const [latestJob] = data.rss.channel.item
        .map((e) => ({
          ...e,
          slug: new URL(decodeURIComponent(e.link)).pathname.split('/').pop(),
        }))
        .slice(0, 1);
      this.logger.log({
        message: `Latest Job: ${JSON.stringify(latestJob)}`,
      });
      if (this.latestJob?.slug !== latestJob.slug) {
        this.latestJob = latestJob;
        await fetch(this.appConfig.pushcutUrl);
      }
    } catch (error) {
      this.logger.error('Failed to fetch jobs', error.stack);
    }
  }

  formatItem(item) {
    return `
      <h1><strong>${item.title}</strong></h1> <br/>
      ${item.description}
    `;
  }

  async sendEmail(mail: Mail.Options) {
    await this.transporter.sendMail(mail);
    this.logger.log('Email successfully sent');
  }

  async getLatestJobProposal() {
    if (!this.latestJob) {
      return {};
    }
    if (
      this.lastGeneratedProposal &&
      this.lastGeneratedProposal.job.slug === this.latestJob
    ) {
      return this.lastGeneratedProposal;
    }

    const content = `
      Generate a proposal based on a job description, my skills and my previous proposal.
      Include in the proposal my name is Jasper Bernales.

      Job Description:
      ${this.latestJob.description}

      My skills:
      TypeScript Fullstack developer (INVITES ONLY - LONG TERM CONTRACTS)
      Frontend: React | Vue | Angular 2+ | Next | Material UI | Tailwind | Bootstrap | GraphQL (apollo/react-query/swr/urql) | Redux
      Backend: NodeJS | NestJS | MongoDB | Postgres | MySQL | Apollo Server | Hasura GraphQL engine | AWS Lambda | Amplify | API Gateway | AppSync | CDK | SAM | serverless
      Payment Integration: Stripe | Plaid

      previous proposal:
      ${this.appConfig.previousProposal}

      proposal:
    `;
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: [{ role: 'user', content }],
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      top_p: 0.8,
    };
    const completion = await this.openai.chat.completions.create(params);
    this.lastGeneratedProposal = {
      proposal: completion.choices[0]?.message?.content,
      job: this.latestJob,
    };
    return this.lastGeneratedProposal;
  }
}
