import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createEventDto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        ...createEventDto,
        startDate: new Date(createEventDto.startDate),
        endDate: new Date(createEventDto.endDate),
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.event.findMany({
      where: { userId },
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    if (event.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este evento',
      );
    }

    return event;
  }

  async update(id: string, userId: string, updateEventDto: UpdateEventDto) {
    await this.findOne(id, userId); // Valida permissão

    return this.prisma.event.update({
      where: { id },
      data: {
        ...updateEventDto,
        startDate: updateEventDto.startDate
          ? new Date(updateEventDto.startDate)
          : undefined,
        endDate: updateEventDto.endDate
          ? new Date(updateEventDto.endDate)
          : undefined,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // Valida permissão

    return this.prisma.event.delete({
      where: { id },
    });
  }
}
