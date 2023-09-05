import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { applicationConfig } from './config';
import * as xml2js from 'xml2js';
import * as nodemailer from 'nodemailer';
import OpenAI from 'openai';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { JobInterface, JobProposalInterface } from './intefaces';

@Injectable()
export class AppService {
  private transporter: nodemailer.Transporter;
  private openai: OpenAI;
  constructor(
    @Inject(applicationConfig.KEY)
    private readonly appConfig: ConfigType<typeof applicationConfig>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

  private latestJob: JobInterface;

  private readonly logger = new Logger(AppService.name);

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    try {
      const [latestJob] = await this.fetchJobs();
      this.logger.log({
        message: `Latest Job: ${JSON.stringify(latestJob)}`,
      });
      if (this.latestJob?.slug !== latestJob.slug) {
        this.latestJob = latestJob;
        await fetch(this.appConfig.pushcutUrl);
        const proposal = await this.generateProposal(latestJob);
        const jobProposal = {
          proposal,
          job: latestJob,
        };
        this.cacheManager.set(latestJob.slug, jobProposal);
        await this.notifyEmail(jobProposal);
      }
    } catch (error) {
      this.logger.error('Failed to fetch jobs', error.stack);
    }
  }

  async notifyEmail({ job, proposal }: JobProposalInterface): Promise<void> {
    await this.transporter.sendMail({
      from: this.appConfig.nodemailer.user,
      to: this.appConfig.recipientEmails,
      subject: `Upwork JobAlert: ${job.title}`,
      html: `
        ${job.description}
        <br/>
        <br/>
        <strong>Generated Proposal:</strong> <br/>
        ${proposal}
      `,
    });
    this.logger.log({ message: 'Email successfully sent' });
  }

  async fetchJobs(): Promise<JobInterface[]> {
    const response = await fetch(this.appConfig.rssUrl);
    const xmlData = await response.text();
    const data = await xml2js.parseStringPromise(xmlData, {
      mergeAttrs: true,
      explicitArray: false,
    });

    return data.rss.channel.item.map((e) => ({
      ...e,
      slug: new URL(decodeURIComponent(e.link)).pathname.split('/').pop(),
    }));
  }

  async getLatestJobProposal(): Promise<JobProposalInterface> {
    if (!this.latestJob) {
      return {
        job: null,
        proposal: null,
      };
    }
    return this.getProposalBySlug(this.latestJob.slug);
  }

  async getProposalBySlug(slug: string): Promise<JobProposalInterface> {
    const cachedProposal =
      await this.cacheManager.get<JobProposalInterface>(slug);
    if (cachedProposal) {
      return cachedProposal;
    }
    const jobs = await this.fetchJobs();
    const job = jobs.find((e) => e.slug === slug);
    if (!job) {
      return {
        job: null,
        proposal: null,
      };
    }
    const proposal = await this.generateProposal(job);
    this.cacheManager.set(job.slug, proposal);
    return {
      proposal,
      job,
    };
  }

  async generateProposal(job: JobInterface) {
    const content = `
      Generate an upwork proposal based on a job description, my skills and my previous proposal.
      Include in the proposal my name is Jasper Bernales. Please don't make it look like AI generated.

      Job Description:
      ${job.description}

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
    return completion.choices[0].message.content;
  }
}
