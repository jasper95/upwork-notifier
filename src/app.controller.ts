import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health-check')
  healthCheck(): string {
    return 'Running';
  }

  @Get('proposal/latest')
  generateLatestJobProposal() {
    return this.appService.getLatestJobProposal();
  }

  @Get('proposal/:slug')
  getProposalBySlug(@Param('slug') slug: string) {
    return this.getProposalBySlug(slug);
  }
}
