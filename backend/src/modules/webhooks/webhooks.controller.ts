import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  HttpCode,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Webhook } from 'svix';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('clerk')
  @HttpCode(200)
  async handleClerkWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      this.logger.error('CLERK_WEBHOOK_SECRET is not set');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify signature using raw body
    const wh = new Webhook(webhookSecret);
    let event: { type: string; data: Record<string, unknown> };

    try {
      // req.body must be raw Buffer — see main.ts rawBody middleware
      const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
      event = wh.verify(rawBody ?? JSON.stringify(req.body), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as typeof event;
    } catch (err) {
      this.logger.warn('Invalid webhook signature', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    this.logger.log(`Clerk webhook received: ${event.type}`);

    try {
      switch (event.type) {
        case 'user.created':
          await this.webhooksService.handleUserCreated(event.data);
          break;
        case 'user.updated':
          await this.webhooksService.handleUserUpdated(event.data);
          break;
        case 'user.deleted':
          await this.webhooksService.handleUserDeleted(event.data);
          break;
      }
    } catch (err) {
      this.logger.error('Error processing webhook', err);
      return res.status(500).json({ error: 'Processing failed' });
    }

    return res.json({ received: true });
  }
}
