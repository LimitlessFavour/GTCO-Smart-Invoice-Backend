import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './activity.entity';

interface CreateActivityParams {
  userId: string;
  action: string;
  relatedEntity: string;
  relatedEntityId: string;
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async create(params: CreateActivityParams): Promise<Activity> {
    try {
      const activity = this.activityRepository.create({
        userId: params.userId,
        action: params.action,
        relatedEntity: params.relatedEntity,
        relatedEntityId: params.relatedEntityId,
      });

      return await this.activityRepository.save(activity);
    } catch (error: any) {
      throw new InternalServerErrorException({
        message: 'Failed to log activity: ' + error.message,
        statusCode: 500,
      });
    }
  }

  async findByUser(userId: string): Promise<Activity[]> {
    try {
      const activities = await this.activityRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });

      if (!activities) {
        return [];
      }

      return activities;
    } catch (error: any) {
      throw new InternalServerErrorException({
        message: 'Failed to fetch user activities: ' + error.message,
        statusCode: 500,
      });
    }
  }
}
