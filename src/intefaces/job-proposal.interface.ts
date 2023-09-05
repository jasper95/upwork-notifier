import { JobInterface } from './job.interface';

export interface JobProposalInterface {
  job: JobInterface | null;
  proposal: string | null;
}
