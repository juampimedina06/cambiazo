import { Injectable } from '@nestjs/common';
import type { ParentStudentLink } from '../../domain/entities/parent-student-link.entity.js';
import type { ParentStudentLinkRepositoryPort } from '../../domain/ports/parent-student-link.repository.port.js';

@Injectable()
export class InMemoryParentStudentLinkRepository
  implements ParentStudentLinkRepositoryPort
{
  private readonly links = new Map<string, ParentStudentLink>();

  async create(link: ParentStudentLink): Promise<ParentStudentLink> {
    const clone = { ...link };
    this.links.set(clone.id, clone);
    return clone;
  }

  async findLink(
    institutionId: string,
    parentUserId: string,
    studentUserId: string,
  ): Promise<ParentStudentLink | null> {
    for (const link of this.links.values()) {
      if (
        link.institutionId === institutionId &&
        link.parentUserId === parentUserId &&
        link.studentUserId === studentUserId
      ) {
        return { ...link };
      }
    }
    return null;
  }

  async findByParentId(parentUserId: string): Promise<ParentStudentLink[]> {
    const results: ParentStudentLink[] = [];
    for (const link of this.links.values()) {
      if (link.parentUserId === parentUserId) {
        results.push({ ...link });
      }
    }
    return results;
  }

  async findByStudentId(studentUserId: string): Promise<ParentStudentLink | null> {
    for (const link of this.links.values()) {
      if (link.studentUserId === studentUserId) {
        return { ...link };
      }
    }
    return null;
  }

  // Clear helper for tests
  clear(): void {
    this.links.clear();
  }
}
