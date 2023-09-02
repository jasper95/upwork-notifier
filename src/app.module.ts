import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { applicationConfig, validationSchema } from './config';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      validationSchema,
      load: [applicationConfig],
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
