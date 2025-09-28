import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import FormData from 'form-data';
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
      
      // Handle authentication command (still needed for initial setup)
      if (text.startsWith('/auth')) {
        const parts = text.split(' ');
        const password = parts[1] || '';
        if (password && password === (process.env.MANAGER_PASSWORD || '')) {
          await this.managerService.registerManager(chatId);
          await this.sendMainMenu(chatId, '✅ You have been registered as a manager.');
        } else {
          await this.sendMessage(chatId, '❌ Invalid manager password.');
        }
      } 
      // Handle start command and show main menu
      else if (text === '/start' || text === '/help') {
        const managers = await this.managerService.getAllManagers();
        const isManager = managers.some(m => m.telegram_chat_id === chatId);
        
        if (isManager) {
          await this.sendMainMenu(chatId);
        } else {
          await this.sendMessage(chatId, 
            `🤖 **Document Verification Bot**\n\n` +
            `Please authenticate first using:\n` +
            `/auth <password>\n\n` +
            `After authentication, you'll get access to the button interface.`
          );
        }
      }
      // For any other text, show main menu if manager
      else {
        const managers = await this.managerService.getAllManagers();
        const isManager = managers.some(m => m.telegram_chat_id === chatId);
        
        if (isManager) {
          await this.sendMainMenu(chatId, 'Use the buttons below to navigate:');
        } else {
          await this.sendMessage(chatId, '❌ You are not authorized. Please authenticate first with /auth <password>');
        }
      }
    } else if (update.callback_query) {
      const data: string = update.callback_query.data;
      const chatId = String(update.callback_query.message.chat.id);
      const messageId = update.callback_query.message.message_id;
      
      try {
        const parsed = JSON.parse(data);
        
        // Handle main menu actions
        if (parsed.type === 'show_pending') {
          await this.showPendingUsers(chatId, messageId);
        } else if (parsed.type === 'show_stats') {
          await this.showStats(chatId, messageId);
        } else if (parsed.type === 'back_to_menu') {
          await this.updateToMainMenu(chatId, messageId);
        } else if (parsed.type === 'refresh_pending') {
          await this.showPendingUsers(chatId, messageId, true);
        }
        // Handle user verification actions
        else if (parsed.type === 'approve' || parsed.type === 'deny') {
          const userId: number = parsed.userId;
          const userIndex = parsed.userIndex || 0;
          
          // Get user details for email notification
          const user = await this.userService.findOne(userId);
          
          if (parsed.type === 'approve') {
            await this.userService.update(userId, { documents_verified_at: new Date().toISOString() } as any);
            
            // Update the message to show approval status
            await this.editMessage(chatId, messageId, 
              `✅ **APPROVED**\n\n` +
              `👤 **${user.name} ${user.lastname}**\n` +
              `📧 ${user.email}\n` +
              `⏰ Approved: ${new Date().toLocaleString('ru-RU')}`, 
              [[
                { text: '🔙 Back to Pending', callback_data: JSON.stringify({ type: 'refresh_pending' }) },
                { text: '🏠 Main Menu', callback_data: JSON.stringify({ type: 'back_to_menu' }) }
              ]]
            );
            
            // Send approval email to user
            try {
              await this.emailService.sendDocumentApprovalEmail(user.email, user.name);
              console.log(`📧 Approval email sent to ${user.email}`);
            } catch (error) {
              console.error('Failed to send approval email:', error);
            }
          } else if (parsed.type === 'deny') {
            await this.userService.update(userId, { 
              documents_verified_at: null,
            } as any);
            
            // Update the message to show denial status
            await this.editMessage(chatId, messageId, 
              `❌ **DENIED**\n\n` +
              `👤 **${user.name} ${user.lastname}**\n` +
              `📧 ${user.email}\n` +
              `⏰ Denied: ${new Date().toLocaleString('ru-RU')}`, 
              [[
                { text: '🔙 Back to Pending', callback_data: JSON.stringify({ type: 'refresh_pending' }) },
                { text: '🏠 Main Menu', callback_data: JSON.stringify({ type: 'back_to_menu' }) }
              ]]
            );
            
            // Send denial email to user
            try {
              await this.emailService.sendDocumentDenialEmail(user.email, user.name);
              console.log(`📧 Denial email sent to ${user.email}`);
            } catch (error) {
              console.error('Failed to send denial email:', error);
            }
          }
        }
        // Handle user detail view
        else if (parsed.type === 'view_user') {
          const userId = parsed.userId;
          await this.showUserDetails(chatId, messageId, userId);
        }
        // Handle pagination
        else if (parsed.type === 'page') {
          const page = parsed.page || 0;
          await this.showPendingUsers(chatId, messageId, true, page);
        }
        
        // Answer callback query to remove loading state
        await axios.post(`https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`, {
          callback_query_id: update.callback_query.id
        });
        
      } catch (e) {
        console.error('Error parsing callback data:', e);
        await axios.post(`https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`, {
          callback_query_id: update.callback_query.id,
          text: '❌ Error processing request'
        });
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

      const userId = await this.resolveUserId(params.email);

      for (const manager of managers) {
        // Send notification message with quick action buttons
        await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
          chat_id: manager.telegram_chat_id,
          text: `🔔 **New Document Submission**\n\n👤 **${params.name}**\n📧 ${params.email}\n⏰ ${new Date().toLocaleString('ru-RU')}`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { 
                  text: '👀 Review Documents', 
                  callback_data: JSON.stringify({ 
                    type: 'view_user', 
                    userId: userId 
                  }) 
                },
              ],
              [
                { 
                  text: '✅ Quick Approve', 
                  callback_data: JSON.stringify({ 
                    type: 'approve', 
                    userId: userId 
                  }) 
                },
                { 
                  text: '❌ Quick Deny', 
                  callback_data: JSON.stringify({ 
                    type: 'deny', 
                    userId: userId 
                  }) 
                },
              ],
              [
                { 
                  text: '📋 View All Pending', 
                  callback_data: JSON.stringify({ 
                    type: 'show_pending' 
                  }) 
                }
              ]
            ],
          },
        });

        // Send documents individually (managers can still access them directly)
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

  private async sendMainMenu(chatId: string, message?: string): Promise<void> {
    const text = message || '🤖 **Document Verification Bot**\n\nChoose an action:';
    
    await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📋 Pending Verifications', callback_data: JSON.stringify({ type: 'show_pending' }) },
          ],
          [
            { text: '📊 Statistics', callback_data: JSON.stringify({ type: 'show_stats' }) },
          ]
        ],
      },
    });
  }

  private async updateToMainMenu(chatId: string, messageId: number): Promise<void> {
    const text = '🤖 **Document Verification Bot**\n\nChoose an action:';
    
    await this.editMessage(chatId, messageId, text, [
      [
        { text: '📋 Pending Verifications', callback_data: JSON.stringify({ type: 'show_pending' }) },
      ],
      [
        { text: '📊 Statistics', callback_data: JSON.stringify({ type: 'show_stats' }) },
      ]
    ]);
  }

  private async showPendingUsers(chatId: string, messageId: number, isRefresh: boolean = false, page: number = 0): Promise<void> {
    try {
      const unprocessedUsers = await this.supabaseService.getUnprocessedUsers();
      
      if (unprocessedUsers.length === 0) {
        await this.editMessage(chatId, messageId, 
          '✅ **No Pending Verifications!**\n\nAll documents have been processed.', 
          [[
            { text: '🔄 Refresh', callback_data: JSON.stringify({ type: 'refresh_pending' }) },
            { text: '🏠 Main Menu', callback_data: JSON.stringify({ type: 'back_to_menu' }) }
          ]]
        );
        return;
      }

      const itemsPerPage = 5;
      const totalPages = Math.ceil(unprocessedUsers.length / itemsPerPage);
      const startIndex = page * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, unprocessedUsers.length);
      const pageUsers = unprocessedUsers.slice(startIndex, endIndex);

      let text = `📋 **Pending Verifications**\n\n`;
      text += `📄 Total: ${unprocessedUsers.length} users\n`;
      text += `📅 Page: ${page + 1}/${totalPages}\n\n`;
      
      const keyboard = [];
      
      // Add user buttons
      for (let i = 0; i < pageUsers.length; i++) {
        const user = pageUsers[i];
        const globalIndex = startIndex + i;
        const submittedDate = new Date(user.documents_submitted_at).toLocaleDateString('ru-RU');
        
        text += `${globalIndex + 1}. **${user.name} ${user.lastname}**\n`;
        text += `   📧 ${user.email}\n`;
        text += `   📅 ${submittedDate}\n\n`;
        
        keyboard.push([{
          text: `👤 ${globalIndex + 1}. ${user.name} ${user.lastname}`,
          callback_data: JSON.stringify({ 
            type: 'view_user', 
            userId: user.id,
            userIndex: globalIndex 
          })
        }]);
      }
      
      // Add pagination buttons if needed
      const paginationRow = [];
      if (page > 0) {
        paginationRow.push({
          text: '⬅️ Previous',
          callback_data: JSON.stringify({ type: 'page', page: page - 1 })
        });
      }
      if (page < totalPages - 1) {
        paginationRow.push({
          text: '➡️ Next',
          callback_data: JSON.stringify({ type: 'page', page: page + 1 })
        });
      }
      if (paginationRow.length > 0) {
        keyboard.push(paginationRow);
      }
      
      // Add control buttons
      keyboard.push([
        { text: '🔄 Refresh', callback_data: JSON.stringify({ type: 'refresh_pending' }) },
        { text: '🏠 Main Menu', callback_data: JSON.stringify({ type: 'back_to_menu' }) }
      ]);
      
      await this.editMessage(chatId, messageId, text, keyboard);
      
    } catch (error) {
      console.error('Error fetching pending users:', error);
      await this.editMessage(chatId, messageId, 
        '❌ **Error**\n\nFailed to fetch pending users. Please try again.', 
        [[
          { text: '🔄 Retry', callback_data: JSON.stringify({ type: 'refresh_pending' }) },
          { text: '🏠 Main Menu', callback_data: JSON.stringify({ type: 'back_to_menu' }) }
        ]]
      );
    }
  }

  private async showUserDetails(chatId: string, messageId: number, userId: number): Promise<void> {
    try {
      const user = await this.userService.findOne(userId);
      if (!user) {
        await this.editMessage(chatId, messageId, '❌ User not found', [[{ 
          text: '🔙 Back', 
          callback_data: JSON.stringify({ type: 'refresh_pending' }) 
        }]]);
        return;
      }

      const submittedDate = new Date(user.documents_submitted_at).toLocaleString('ru-RU');
      
      const text = `👤 **User Details**\n\n` +
                   `**Name:** ${user.name} ${user.lastname}\n` +
                   `**Email:** ${user.email}\n` +
                   `**Submitted:** ${submittedDate}\n\n` +
                   `📄 **Documents:**\n` +
                   `🔗 [Front Document](${user.document_front_url})\n` +
                   `🔗 [Back Document](${user.document_back_url})\n` +
                   `🔗 [Selfie with Document](${user.document_selfie_url})`;

      const keyboard = [
        [
          { 
            text: '✅ Approve', 
            callback_data: JSON.stringify({ 
              type: 'approve', 
              userId: user.id
            }) 
          },
          { 
            text: '❌ Deny', 
            callback_data: JSON.stringify({ 
              type: 'deny', 
              userId: user.id
            }) 
          },
        ],
        [
          { text: '🔙 Back to List', callback_data: JSON.stringify({ type: 'refresh_pending' }) },
          { text: '🏠 Main Menu', callback_data: JSON.stringify({ type: 'back_to_menu' }) }
        ]
      ];
      
      await this.editMessage(chatId, messageId, text, keyboard);
      
    } catch (error) {
      console.error('Error fetching user details:', error);
      await this.editMessage(chatId, messageId, '❌ Error fetching user details', [[{ 
        text: '🔙 Back', 
        callback_data: JSON.stringify({ type: 'refresh_pending' }) 
      }]]);
    }
  }

  private async showStats(chatId: string, messageId: number): Promise<void> {
    try {
      // Get all users with submitted documents using Supabase client directly
      const { data: allUsers, error } = await this.supabaseService.getClient()
        .from('users')
        .select('*')
        .not('documents_submitted_at', 'is', null);
        
      if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
      }
      const pendingUsers = await this.supabaseService.getUnprocessedUsers();
      const approvedUsers = allUsers.filter(u => u.documents_verified_at !== null);
      const deniedUsers = allUsers.filter(u => u.documents_verified_at === null && u.documents_submitted_at !== null);
      
      const text = `📊 **Statistics**\n\n` +
                   `📄 **Total Submissions:** ${allUsers.length}\n` +
                   `⏳ **Pending:** ${pendingUsers.length}\n` +
                   `✅ **Approved:** ${approvedUsers.length}\n` +
                   `❌ **Denied:** ${deniedUsers.length}\n\n` +
                   `📅 **Last Updated:** ${new Date().toLocaleString('ru-RU')}`;
      
      await this.editMessage(chatId, messageId, text, [
        [
          { text: '🔄 Refresh', callback_data: JSON.stringify({ type: 'show_stats' }) },
          { text: '🏠 Main Menu', callback_data: JSON.stringify({ type: 'back_to_menu' }) }
        ]
      ]);
      
    } catch (error) {
      console.error('Error fetching statistics:', error);
      await this.editMessage(chatId, messageId, '❌ Error fetching statistics', [[{ 
        text: '🏠 Main Menu', 
        callback_data: JSON.stringify({ type: 'back_to_menu' }) 
      }]]);
    }
  }

  private async editMessage(chatId: string, messageId: number, text: string, keyboard: any[][] = []): Promise<void> {
    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/editMessageText`, {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
    } catch (error) {
      // If edit fails (e.g., message is too old), send a new message
      console.log('Failed to edit message, sending new one:', error.response?.data?.description);
      await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
    }
  }
}


