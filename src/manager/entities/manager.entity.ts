import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('managers')
@Unique(['telegram_chat_id'])
export class Manager {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 32 })
  telegram_chat_id: string;

  @CreateDateColumn()
  created_at: Date;
}


