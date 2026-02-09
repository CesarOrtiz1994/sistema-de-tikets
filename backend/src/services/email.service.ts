import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from '../config/logger';
import prisma from '../config/database';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private initialized = false;

  /**
   * Inicializar el transporter de nodemailer
   */
  private initialize() {
    if (this.initialized) return;

    if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
      logger.warn('SMTP credentials not configured. Email service disabled.');
      this.initialized = true;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD
      }
    });

    this.initialized = true;
    logger.info('Email service initialized');
  }

  /**
   * Verificar conexión SMTP
   */
  async verifyConnection(): Promise<boolean> {
    this.initialize();
    if (!this.transporter) return false;

    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified');
      return true;
    } catch (error) {
      logger.error('SMTP connection failed:', error);
      return false;
    }
  }

  /**
   * Enviar email usando un template de la base de datos
   */
  async sendTemplateEmail(
    to: string,
    templateCode: string,
    variables: Record<string, string>
  ): Promise<boolean> {
    this.initialize();
    if (!this.transporter) {
      logger.warn(`Email not sent (SMTP disabled): template=${templateCode}, to=${to}`);
      return false;
    }

    try {
      // Buscar template en la base de datos
      const template = await prisma.emailTemplate.findUnique({
        where: { code: templateCode }
      });

      if (!template || !template.isActive) {
        logger.warn(`Email template not found or inactive: ${templateCode}`);
        return false;
      }

      // Reemplazar variables en subject y body
      let subject = template.subject;
      let htmlBody = template.htmlBody;
      let textBody = template.textBody || '';

      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
        htmlBody = htmlBody.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
        textBody = textBody.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
      }

      await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        html: htmlBody,
        text: textBody || undefined
      });

      logger.info(`Email sent: template=${templateCode}, to=${to}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email: template=${templateCode}, to=${to}`, error);
      return false;
    }
  }

  /**
   * Enviar email directo (sin template)
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<boolean> {
    this.initialize();
    if (!this.transporter) {
      logger.warn(`Email not sent (SMTP disabled): subject=${subject}, to=${to}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
        text
      });

      logger.info(`Email sent: subject=${subject}, to=${to}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email: subject=${subject}, to=${to}`, error);
      return false;
    }
  }
}

export const emailService = new EmailService();
