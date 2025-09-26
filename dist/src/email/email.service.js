"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
let EmailService = class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    async generateSixDigitCode() {
        const code = Math.floor(100000 + Math.random() * 900000);
        return String(code);
    }
    async sendVerificationEmail(email, code, ttlMinutes) {
        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: email,
                subject: 'Email Verification Code',
                html: `
          <h2>Email Verification</h2>
          <p>Your verification code is: <strong>${code}</strong></p>
          <p>This code will expire in ${ttlMinutes} minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
        `,
            });
            console.log(`Verification email sent to ${email}: code=${code}`);
        }
        catch (error) {
            console.error('Failed to send verification email:', error);
            throw new Error('Failed to send verification email');
        }
    }
    async sendDocumentApprovalEmail(email, name) {
        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: email,
                subject: 'Документы одобрены - Documents Approved',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">✅ Документы одобрены!</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px; color: #333;">Здравствуйте, <strong>${name}</strong>!</p>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Отличные новости! Ваши документы были успешно проверены и одобрены нашими модераторами.
              </p>
              
              <div style="background: #e8f5e8; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #2d5a2d; font-weight: bold;">
                  🎉 Теперь у вас есть полный доступ ко всем функциям платформы!
                </p>
              </div>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Вы можете войти в свой аккаунт и начать пользоваться всеми доступными услугами.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/signin" 
                   style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Войти в аккаунт
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              
              <p style="font-size: 14px; color: #666; text-align: center;">
                Спасибо за использование нашей платформы!<br>
                Если у вас есть вопросы, свяжитесь с нашей службой поддержки.
              </p>
            </div>
          </div>
        `,
            });
            console.log(`Document approval email sent to ${email}`);
        }
        catch (error) {
            console.error('Failed to send document approval email:', error);
            throw new Error('Failed to send document approval email');
        }
    }
    async sendDocumentDenialEmail(email, name) {
        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: email,
                subject: 'Документы отклонены - Documents Denied',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f44336, #d32f2f); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">❌ Документы отклонены</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px; color: #333;">Здравствуйте, <strong>${name}</strong>!</p>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                К сожалению, ваши документы не прошли проверку модераторов.
              </p>
              
              <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #c62828; font-weight: bold;">
                  📋 Возможные причины отклонения:
                </p>
                <ul style="color: #c62828; margin: 10px 0 0 20px;">
                  <li>Нечеткое качество фотографий</li>
                  <li>Неполная информация в документах</li>
                  <li>Несоответствие требованиям</li>
                </ul>
              </div>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Пожалуйста, проверьте ваши документы и загрузите их повторно. Убедитесь, что:
              </p>
              
              <ul style="color: #333; line-height: 1.6;">
                <li>Фотографии четкие и хорошо освещены</li>
                <li>Все данные хорошо видны</li>
                <li>Документы действительны</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/signin" 
                   style="background: #f44336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Загрузить документы заново
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              
              <p style="font-size: 14px; color: #666; text-align: center;">
                Если у вас есть вопросы о процессе верификации, свяжитесь с нашей службой поддержки.<br>
                Мы готовы помочь вам пройти верификацию успешно.
              </p>
            </div>
          </div>
        `,
            });
            console.log(`Document denial email sent to ${email}`);
        }
        catch (error) {
            console.error('Failed to send document denial email:', error);
            throw new Error('Failed to send document denial email');
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
//# sourceMappingURL=email.service.js.map