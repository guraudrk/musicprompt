import "server-only";
import { prisma } from "./prisma";
import { PrismaProjectRepository } from "@/domain/project/prismaProjectRepository";

export const projectRepository = new PrismaProjectRepository(prisma);
