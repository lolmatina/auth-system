import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Manager } from './entities/manager.entity';

@Injectable()
export class ManagerService {
  constructor(
    @InjectRepository(Manager)
    private readonly managerRepository: Repository<Manager>,
  ) {}

  async registerManager(chatId: string): Promise<Manager> {
    let manager = await this.managerRepository.findOne({ where: { telegram_chat_id: chatId } });
    if (manager) return manager;
    manager = this.managerRepository.create({ telegram_chat_id: chatId });
    return this.managerRepository.save(manager);
  }

  async getAllManagers(): Promise<Manager[]> {
    return this.managerRepository.find();
  }
}


