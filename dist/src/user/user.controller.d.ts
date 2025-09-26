import { Response } from 'express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from '../auth/auth.service';
export declare class UserController {
    private readonly userService;
    private readonly authService;
    constructor(userService: UserService, authService: AuthService);
    create(createUserDto: CreateUserDto, res: Response): Promise<Response<any, Record<string, any>>>;
    getCurrentUser(req: any, res: Response): Promise<Response<any, Record<string, any>>>;
    findOne(id: number, res: Response): Promise<Response<any, Record<string, any>>>;
    update(id: number, updateUserDto: UpdateUserDto, res: Response): Promise<Response<any, Record<string, any>>>;
    remove(id: number, res: Response): Promise<Response<any, Record<string, any>>>;
}
