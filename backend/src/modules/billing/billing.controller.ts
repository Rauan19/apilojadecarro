import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  AllowWhenBlocked,
  CurrentUser,
  Public,
  Roles,
} from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { PlansService } from '../plans/plans.service';
import { BillingService } from './billing.service';
import { SubscribeDto } from './dto/subscribe.dto';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
// Todo o módulo fica acessível para a loja bloqueada — é por aqui que ela
// paga e sai do bloqueio.
@AllowWhenBlocked()
@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private readonly billing: BillingService,
    private readonly plans: PlansService,
  ) {}

  /**
   * Vitrine de planos para a loja. O CRUD em /plans é só do Super Admin —
   * aqui o dono da loja vê apenas os planos ativos, para poder assinar.
   */
  @Get('plans')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN)
  @ApiOperation({ summary: 'Planos disponíveis para assinatura' })
  @ApiQuery({ name: 'companyId', required: false })
  async listPlans(
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    // Super Admin sem empresa alvo vê todos os planos; a loja vê os públicos
    // mais os exclusivos dela, nunca os exclusivos de outra loja.
    const targetCompanyId =
      user.role === Role.SUPER_ADMIN
        ? (companyId ?? user.companyId ?? undefined)
        : (user.companyId ?? null);

    const data = await this.plans.findAll(true, targetCompanyId);
    return { message: 'Planos listados com sucesso', data };
  }

  @Get('subscription')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN)
  @ApiOperation({ summary: 'Assinatura atual da loja' })
  @ApiQuery({ name: 'companyId', required: false })
  async getSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.billing.getSubscription(user, companyId);
    return { message: 'Assinatura obtida com sucesso', data };
  }

  @Get('invoices')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN)
  @ApiOperation({ summary: 'Histórico de faturas da loja' })
  @ApiQuery({ name: 'companyId', required: false })
  async listInvoices(
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.billing.listInvoices(user, companyId);
    return { message: 'Faturas listadas com sucesso', data };
  }

  @Post('subscribe')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN)
  @ApiOperation({
    summary: 'Assinar ou trocar de plano (gera o PIX do ciclo)',
  })
  @ApiQuery({ name: 'companyId', required: false })
  async subscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubscribeDto,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.billing.subscribe(user, dto, companyId);
    return { message: 'Assinatura atualizada com sucesso', data };
  }

  @Post('invoices/:id/pix')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN)
  @ApiOperation({ summary: 'Gerar 2ª via do PIX de uma fatura' })
  @ApiQuery({ name: 'companyId', required: false })
  async refreshPix(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') invoiceId: string,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.billing.refreshInvoicePix(
      user,
      invoiceId,
      companyId,
    );
    return { message: 'PIX gerado com sucesso', data };
  }

  @Post('cancel')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN)
  @ApiOperation({ summary: 'Cancelar a renovação da assinatura' })
  @ApiQuery({ name: 'companyId', required: false })
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.billing.cancel(user, companyId);
    return { message: 'Assinatura cancelada — vale até o fim do ciclo', data };
  }

  /**
   * Notificação do Mercado Pago. Público por natureza: a autenticidade vem da
   * assinatura HMAC no header `x-signature`, não de token.
   */
  @Post('webhooks/mercadopago')
  @Public()
  @SkipThrottle()
  @ApiExcludeEndpoint()
  async mercadoPagoWebhook(
    @Body() body: Record<string, unknown>,
    @Query() query: Record<string, unknown>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    await this.billing.handleMercadoPagoWebhook(body ?? {}, query ?? {}, headers);
    return { message: 'ok' };
  }
}
