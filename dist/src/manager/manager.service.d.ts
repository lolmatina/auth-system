import { Repository } from 'typeorm';
import { Manager } from './entities/manager.entity';
export declare class ManagerService {
    private readonly managerRepository;
    constructor(managerRepository: Repository<Manager>);
    registerManager(chatId: string): Promise<Manager>;
    getAllManagers(): Promise<Manager[]>;
}
