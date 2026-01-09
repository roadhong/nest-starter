import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import ServerLogger from '@root/core/server-logger/server.logger';
import ObjectUtil from '@root/core/utils/obj.utils';
import { BatchCronRepository } from '@root/server/batch/cron/batch.cron.repository';
import { DBCronJobInfo } from '@root/server/batch/cron/batch.cron.schema';
import { CUSTOM_CRON_KEY, ICustomCronMetadata } from '@root/server/batch/decorator/batch.decorator';
import { CronJobData } from '@root/server/batch/dto/batch.response.dto';
import BatchError from '@root/server/batch/error/batch.error';
import { CronJob } from 'cron';

@Injectable()
export class BatchCronService implements OnModuleInit {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly cronRepository: BatchCronRepository,
    private readonly discoveryService: DiscoveryService,
  ) {}

  private cronMethodMap: Map<string, () => Promise<any>> = new Map();

  /**
   * CustomCron 데코레이터가 붙은 모든 크론 메서드를 자동 등록한다.
   * - 각 key별로 메서드를 메모리 맵에 저장하고, 등록된 job 정보가 있으면 반영한다.
   */
  async onModuleInit(): Promise<void> {
    const providers = this.discoveryService.getProviders();
    for (const wrapper of providers) {
      const instance = wrapper.instance;
      if (!instance) continue;
      const cronMeta: ICustomCronMetadata[] = Reflect.getMetadata(CUSTOM_CRON_KEY, instance.constructor) || [];
      for (const { name, method, cronTime } of cronMeta) {
        const cronMethod = instance[method];
        if (typeof cronMethod === 'function') {
          this.cronMethodMap.set(name, cronMethod.bind(instance));

          let _cronTime = cronTime;
          let _active = true;

          const job = await this.getJobInfoAsync(name);
          if (job) {
            _cronTime = job.cronTime || _cronTime;
            _active = job.active;
          }
          await this.updateJobAsync(name, _cronTime, _active);
        }
      }
    }
  }

  /**
   * 등록된 크론 메서드를 name로 조회한다.
   */
  getCronMethodByKey(name: string): (() => Promise<any>) | undefined {
    return this.cronMethodMap.get(name);
  }

  /**
   * 현재 등록된 모든 크론 job의 정보를 반환한다.
   */
  getJobs(): CronJobData[] {
    const jobs = this.schedulerRegistry.getCronJobs();

    return Array.from(jobs.entries()).map(([name, job]) => ({
      name,
      cronTime: job.cronTime.source.toString(),
      beforeDate: job.lastDate() ? job.lastDate().toISOString() : null,
      nextDate: job.nextDate().toJSDate().toISOString(),
      active: job.isActive,
    }));
  }

  /**
   * 지정한 크론 job을 즉시 실행한다.
   */
  async executeJobAsync(name: string): Promise<void> {
    const job = this.schedulerRegistry.getCronJob(name);
    await job.fireOnTick();
  }

  /**
   * 크론 job을 동적으로 수정한다.
   */
  async updateJobAsync(name: string, cronTime: string, active: boolean): Promise<void> {
    const cronMethod = this.getCronMethodByKey(name);
    if (!cronMethod) {
      throw BatchError.CRON_UPDATE_FAILED(`invalid name: ${name}`);
    }

    cronTime = ObjectUtil.isCronTime(cronTime) ? cronTime : CronExpression.EVERY_10_MINUTES;
    active = active ?? true;

    let job;
    try {
      job = this.schedulerRegistry.getCronJob(name);
    } catch {
      job = undefined;
    }

    // cronTime 바뀐경우
    if (job) {
      const currentCronTime = job.cronTime?.source?.toString?.() ?? '';
      if (currentCronTime !== cronTime) {
        try {
          this.schedulerRegistry.deleteCronJob(name);
          ServerLogger.log(`[CRON Update] deleteCronJob: name=${name}`, 'BatchDataSync');
        } catch (e) {
          ServerLogger.warn(`[CRON Update] deleteCronJob FAIL: name=${name}, reason=${e?.message}`, 'BatchDataSync');
        }
        job = undefined;
      }
    }

    if (!job) {
      job = new CronJob(cronTime, cronMethod, null, false);
      this.schedulerRegistry.addCronJob(name, job as any);
      ServerLogger.log(`[CRON Update] addCronJob: name=${name}, cronTime=${cronTime}, status=${active}`, 'BatchDataSync');
    }

    // status만 바뀐 경우
    if (active) {
      job.start();
      ServerLogger.log(`[CRON Update] job started: name=${name}`, 'BatchDataSync');
    } else {
      job.stop();
      ServerLogger.log(`[CRON Update] job stopped: name=${name}`, 'BatchDataSync');
    }

    await this.setJobInfoAsync(name, { cronTime, active });
  }

  /**
   * Redis에서 크론 job 정보를 조회한다.
   */
  async getJobInfoAsync(name: string): Promise<DBCronJobInfo | undefined> {
    return await this.cronRepository.getJobInfoAsync(name);
  }

  /**
   * Redis에 크론 job 정보를 저장한다.
   */
  async setJobInfoAsync(name: string, value: DBCronJobInfo): Promise<void> {
    return await this.cronRepository.setJobInfoAsync(name, value);
  }
}
