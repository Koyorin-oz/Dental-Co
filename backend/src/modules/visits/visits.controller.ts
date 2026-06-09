import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { CreateVisitDto, CreateReportDto } from './dto/create-visit.dto';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('visits')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get('mine')
  @Roles('DOCTOR', 'ADMIN')
  getMyVisits(@CurrentUser() user: { clerkId: string }) {
    return this.visitsService.findByCurrentDoctor(user.clerkId);
  }

  @Post()
  @Roles('DOCTOR', 'ADMIN')
  create(@Body() dto: CreateVisitDto) {
    return this.visitsService.create(dto);
  }

  @Get(':id')
  @Roles('DOCTOR', 'RECEPTIONIST', 'ADMIN')
  findOne(@Param('id') id: string) {
    return this.visitsService.findOne(id);
  }

  @Put(':id/report/draft')
  @Roles('DOCTOR', 'ADMIN')
  saveDraft(@Param('id') id: string, @Body() dto: CreateReportDto) {
    return this.visitsService.saveDraft(id, dto);
  }

  @Put(':id/report/sign')
  @Roles('DOCTOR', 'ADMIN')
  signReport(
    @Param('id') id: string,
    @Body() dto: CreateReportDto,
    @CurrentUser() user: { clerkId: string },
  ) {
    return this.visitsService.saveReport(id, dto, user.clerkId);
  }
}
