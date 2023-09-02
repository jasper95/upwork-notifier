import { Controller, Get } from '@nestjs/common';

@Controller('health-check')
export class AppController {
  @Get()
  healthCheck(): string {
    return 'Running';
  }
}
