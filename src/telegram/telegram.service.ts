import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as FormData from 'form-data';
import { ManagerService } from '../manager/manager.service';
import { UserService } from '../user/user.service';
import { EmailService } from '../email/email.service';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class TelegramService {
  private readonly botToken: string;

  constructor(
    private readonly managerService: ManagerService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly supabaseService: SupabaseService,
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
      } else if (text === '/unprocessed' || text === '/pending') {
        // Check if user is a registered manager
        const managers = await this.managerService.getAllManagers();
        const isManager = managers.some(m => m.telegram_chat_id === chatId);
        
        if (!isManager) {
          await this.sendMessage(chatId, '❌ You are not authorized to use this command. Please authenticate first with /auth <password>');
          return;
        }

        try {
          const unprocessedUsers = await this.supabaseService.getUnprocessedUsers();
          
          if (unprocessedUsers.length === 0) {
            await this.sendMessage(chatId, '✅ No pending document verifications!');
            return;
          }

          // Send header message
          await this.sendMessage(chatId, `📋 **Unprocessed Users (${unprocessedUsers.length})**\n\nClick on each user to view their documents and verify/deny:`);
          
          // Send each user as a separate message with inline buttons
          for (let i = 0; i < unprocessedUsers.length; i++) {
            const user = unprocessedUsers[i];
            const submittedDate = new Date(user.documents_submitted_at).toLocaleString('ru-RU');
            
            const userMessage = `${i + 1}. **${user.name} ${user.lastname}**\n` +
                               `📧 ${user.email}\n` +
                               `📅 Submitted: ${submittedDate}\n\n` +
                               `📄 Documents:\n` +
                               `🔗 [Front Document](${user.document_front_url})\n` +
                               `🔗 [Back Document](${user.document_back_url})\n` +
                               `🔗 [Selfie with Document](${user.document_selfie_url})`;

            // Send message with inline buttons for approve/deny
            await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
              chat_id: chatId,
              text: userMessage,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [
                    { 
                      text: '✅ Approve', 
                      callback_data: JSON.stringify({ 
                        type: 'approve', 
                        userId: user.id,
                        source: 'list' 
                      }) 
                    },
                    { 
                      text: '❌ Deny', 
                      callback_data: JSON.stringify({ 
                        type: 'deny', 
                        userId: user.id,
                        source: 'list' 
                      }) 
                    },
                  ],
                  [
                    { 
                      text: '📋 Refresh List', 
                      callback_data: JSON.stringify({ 
                        type: 'refresh_list',
                        source: 'list' 
                      }) 
                    }
                  ]
                ],
              },
            });
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          await this.sendMessage(chatId, 
            `\n💡 **Commands:**\n` +
            `/unprocessed - Show this list again\n` +
            `/auth <password> - Authenticate as manager\n` +
            `/help - Show all commands`
          );
          
        } catch (error) {
          console.error('Error fetching unprocessed users:', error);
          await this.sendMessage(chatId, '❌ Error fetching unprocessed users. Please try again.');
        }
      } else if (text === '/help' || text === '/start') {
        await this.sendMessage(chatId, 
          `🤖 **Document Verification Bot**\n\n` +
          `**Available Commands:**\n` +
          `/auth <password> - Authenticate as manager\n` +
          `/unprocessed - List users with pending document verification\n` +
          `/pending - Same as /unprocessed\n` +
          `/help - Show this help message\n\n` +
          `**How to Verify Documents:**\n` +
          `1. Use /unprocessed to see pending users\n` +
          `2. Click document links to view images\n` +
          `3. Click ✅ Approve or ❌ Deny buttons\n` +
          `4. User receives automatic email notification\n\n` +
          `**Features:**\n` +
          `• Automatic notifications for new submissions\n` +
          `• Direct document links for easy viewing\n` +
          `• One-click approve/deny with email alerts\n` +
          `• Real-time list updates`
        );
      }
    } else if (update.callback_query) {
      const data: string = update.callback_query.data;
      const chatId = String(update.callback_query.message.chat.id);
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'approve' || parsed.type === 'deny') {
          const userId: number = parsed.userId;
          const source = parsed.source || 'notification'; // 'notification' or 'list'
          
          // Get user details for email notification
          const user = await this.userService.findOne(userId);
          
          if (parsed.type === 'approve') {
            await this.userService.update(userId, { documents_verified_at: new Date().toISOString() } as any);
            
            const successMessage = `✅ **Documents Approved**\n👤 User: ${user.name} ${user.lastname}\n📧 Email: ${user.email}`;
            await this.sendMessage(chatId, successMessage);
            
            // Send approval email to user
            try {
              await this.emailService.sendDocumentApprovalEmail(user.email, user.name);
              console.log(`📧 Approval email sent to ${user.email}`);
            } catch (error) {
              console.error('Failed to send approval email:', error);
              await this.sendMessage(chatId, '⚠️ User approved but email notification failed.');
            }
          } else if (parsed.type === 'deny') {
            // For denial, we can either set to null or remove the documents_submitted_at to require resubmission
            await this.userService.update(userId, { 
              documents_verified_at: null,
              // Optionally reset submission to force resubmission:
              // documents_submitted_at: null,
              // document_front_url: null,
              // document_back_url: null,
              // document_selfie_url: null,
            } as any);
            
            const denyMessage = `❌ **Documents Denied**\n👤 User: ${user.name} ${user.lastname}\n📧 Email: ${user.email}`;
            await this.sendMessage(chatId, denyMessage);
            
            // Send denial email to user
            try {
              await this.emailService.sendDocumentDenialEmail(user.email, user.name);
              console.log(`📧 Denial email sent to ${user.email}`);
            } catch (error) {
              console.error('Failed to send denial email:', error);
              await this.sendMessage(chatId, '⚠️ User denied but email notification failed.');
            }
          }
          
          // If action came from the list, offer to refresh
          if (source === 'list') {
            await this.sendMessage(chatId, '💡 Use /unprocessed to see updated list.');
          }
          
        } else if (parsed.type === 'refresh_list') {
          // Refresh the unprocessed users list
          await this.sendMessage(chatId, '🔄 Refreshing unprocessed users list...');
          
          // Simulate the /unprocessed command
          const managers = await this.managerService.getAllManagers();
          const isManager = managers.some(m => m.telegram_chat_id === chatId);
          
          if (isManager) {
            const unprocessedUsers = await this.supabaseService.getUnprocessedUsers();
            
            if (unprocessedUsers.length === 0) {
              await this.sendMessage(chatId, '✅ No pending document verifications!');
              return;
            }

            await this.sendMessage(chatId, `📋 **Updated Unprocessed Users (${unprocessedUsers.length})**\n\nClick on each user to verify/deny:`);
            
            for (let i = 0; i < unprocessedUsers.length; i++) {
              const user = unprocessedUsers[i];
              const submittedDate = new Date(user.documents_submitted_at).toLocaleString('ru-RU');
              
              const userMessage = `${i + 1}. **${user.name} ${user.lastname}**\n` +
                                 `📧 ${user.email}\n` +
                                 `📅 Submitted: ${submittedDate}\n\n` +
                                 `📄 Documents:\n` +
                                 `🔗 [Front](${user.document_front_url})\n` +
                                 `🔗 [Back](${user.document_back_url})\n` +
                                 `🔗 [Selfie](${user.document_selfie_url})`;

              await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                chat_id: chatId,
                text: userMessage,
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [
                    [
                      { text: '✅ Approve', callback_data: JSON.stringify({ type: 'approve', userId: user.id, source: 'list' }) },
                      { text: '❌ Deny', callback_data: JSON.stringify({ type: 'deny', userId: user.id, source: 'list' }) },
                    ]
                  ],
                },
              });
              
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        }
      } catch (e) {
        console.error('Error parsing callback data:', e);
        await this.sendMessage(chatId, '❌ Error processing your request. Please try again.');
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


