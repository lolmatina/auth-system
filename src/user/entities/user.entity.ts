import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 50 })
  lastname: string;

  @Column({ type: 'text' })
  @Exclude()
  password: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ type: 'timestamp', nullable: true })
  email_verified_at: Date | null;

  @Column({ type: 'varchar', length: 6, nullable: true })
  email_verification_code: string | null;

  @Column({ type: 'timestamp', nullable: true })
  email_verification_expires_at: Date | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  document_front_url: string | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  document_back_url: string | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  document_selfie_url: string | null;

  @Column({ type: 'timestamp', nullable: true })
  documents_submitted_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  documents_verified_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
