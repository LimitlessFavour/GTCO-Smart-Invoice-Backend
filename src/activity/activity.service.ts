import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, ActivityType } from './activity.entity';

interface CreateActivityDto {
  type: ActivityType;
  entityType: string;
  entityId: string;
  companyId: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async create(createActivityDto: CreateActivityDto): Promise<Activity> {
    const activity = this.activityRepository.create(createActivityDto);
    return await this.activityRepository.save(activity);
  }

  async findByCompany(
    companyId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Activity[]> {
    const query = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.companyId = :companyId', { companyId })
      .orderBy('activity.createdAt', 'DESC');

    if (startDate && endDate) {
      query.andWhere('activity.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return query.getMany();
  }

  async findByEntityType(
    companyId: string,
    entityType: string,
  ): Promise<Activity[]> {
    return this.activityRepository.find({
      where: { companyId, entityType },
      order: { createdAt: 'DESC' },
    });
  }
}
