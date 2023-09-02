import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { applicationConfig } from './config';
import * as xml2js from 'xml2js';
import { isToday } from 'date-fns';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

@Injectable()
export class AppService {
  private transporter: nodemailer.Transporter;
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
  }

  private notifiedUrls: string[] = [];
  private lastCheckedDate = new Date();

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
      const isMatched = (dateString) => {
        const date = new Date(dateString);
        return isToday(date);
      };
      const jobsToday = data.rss.channel.item
        .map((e) => ({
          ...e,
          slug: new URL(decodeURIComponent(e.link)).pathname.split('/').pop(),
        }))
        .filter(
          (e) => isMatched(e.pubDate) && !this.notifiedUrls.includes(e.slug),
        );
      this.logger.log({
        message: `Jobs Matched: ${jobsToday.length}`,
      });
      if (jobsToday.length) {
        await fetch(this.appConfig.pushcutUrl);
        this.notifiedUrls.push(...jobsToday.map((e) => e.slug));
        this.logger.log({
          message: `Push notification sent`,
        });
        if (!isToday(this.lastCheckedDate)) {
          this.lastCheckedDate = new Date();
          this.notifiedUrls = [];
        }
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
}
