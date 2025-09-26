import { SupabaseService, User } from '../database/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UserService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    create(createUserDto: CreateUserDto): Promise<User>;
    findAll(): Promise<User[]>;
    findOne(id: number): Promise<User>;
    findByEmail(email: string): Promise<User>;
    setEmailVerificationCode(userId: number, code: string, expiresAt: Date): Promise<void>;
    verifyEmailCode(email: string, code: string): Promise<boolean>;
    update(id: number, updateUserDto: UpdateUserDto | any): Promise<User>;
    remove(id: number): Promise<void>;
}
