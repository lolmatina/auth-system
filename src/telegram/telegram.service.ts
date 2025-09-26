import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as FormData from 'form-data';
import { ManagerService } from '../manager/manager.service';
import { UserService } from '../user/user.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class TelegramService {
  private readonly botToken: string;

  constructor(
    private readonly managerService: ManagerService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
  ) {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
  }

  async handleUpdate(update: any): Promise<void> {
    if (!this.botToken) return;
    if (update.message && update.message.text) {
      const chatId = String(update.message.chat.id);
      const text: string = update.message.text.trim();
      if (text.startsWith('/auth')) {
        const parts = text.split(' ');
        const password = parts[1] || '';
        if (password && password === (process.env.MANAGER_PASSWORD || '')) {
          await this.managerService.registerManager(chatId);
          await this.sendMessage(chatId, '✅ You have been registered as a manager.');
        } else {
          await this.sendMessage(chatId, '❌ Invalid manager password.');
        }
      }
    } else if (update.callback_query) {
      const data: string = update.callback_query.data;
      const chatId = String(update.callback_query.message.chat.id);
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'approve' || parsed.type === 'deny') {
          const userId: number = parsed.userId;
          
          // Get user details for email notification
          const user = await this.userService.findOne(userId);
          
          if (parsed.type === 'approve') {
            await this.userService.update(userId, { documents_verified_at: new Date() } as any);
            await this.sendMessage(chatId, '✅ Documents approved.');
            
            // Send approval email to user
            try {
              await this.emailService.sendDocumentApprovalEmail(user.email, user.name);
              console.log(`📧 Approval email sent to ${user.email}`);
            } catch (error) {
              console.error('Failed to send approval email:', error);
              // Don't fail the approval process if email fails
            }
          } else {
            await this.userService.update(userId, { documents_verified_at: null } as any);
            await this.sendMessage(chatId, '❌ Documents denied.');
            
            // Send denial email to user
            try {
              await this.emailService.sendDocumentDenialEmail(user.email, user.name);
              console.log(`📧 Denial email sent to ${user.email}`);
            } catch (error) {
              console.error('Failed to send denial email:', error);
              // Don't fail the denial process if email fails
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }

  async sendDocumentSubmission(params: { email: string; name: string; frontPath: string; backPath: string; selfiePath: string; }): Promise<void> {
    if (!this.botToken) {
      console.log('Telegram bot not configured, skipping document submission:', params);
      return;
    }

    try {
      const managers = await this.managerService.getAllManagers();
      if (!managers.length) {
        console.log('No managers registered; skipping broadcast');
        return;
      }

      for (const manager of managers) {
        // Send text with inline buttons
        await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
          chat_id: manager.telegram_chat_id,
          text: `📋 New Document Submission\n\n👤 User: ${params.name}\n📧 Email: ${params.email}`,
          reply_markup: {
            inline_keyboard: [
              [
                { text: 'Approve ✅', callback_data: JSON.stringify({ type: 'approve', userId: await this.resolveUserId(params.email) }) },
                { text: 'Deny ❌', callback_data: JSON.stringify({ type: 'deny', userId: await this.resolveUserId(params.email) }) },
              ],
            ],
          },
        });

        // Send documents individually
        await this.sendDocument(manager.telegram_chat_id, params.frontPath, 'passport_front.jpg');
        await this.sendDocument(manager.telegram_chat_id, params.backPath, 'passport_back.jpg');
        await this.sendDocument(manager.telegram_chat_id, params.selfiePath, 'selfie_with_passport.jpg');
      }

      console.log(`Document submission sent to Telegram managers for user: ${params.email}`);
    } catch (error) {
      console.error('Failed to send document submission to Telegram:', error);
      throw new Error('Failed to send document submission to moderators');
    }
  }

  private async resolveUserId(email: string): Promise<number> {
    const user = await this.userService.findByEmail(email);
    return user?.id;
  }

  private async sendMessage(chatId: string, text: string): Promise<void> {
    await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      chat_id: chatId,
      text,
    });
  }

  private async sendDocument(chatId: string, filePath: string, filename: string): Promise<void> {
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('document', fs.createReadStream(filePath), { filename });
    await axios.post(`https://api.telegram.org/bot${this.botToken}/sendDocument`, formData, {
      headers: formData.getHeaders(),
    });
  }
}


