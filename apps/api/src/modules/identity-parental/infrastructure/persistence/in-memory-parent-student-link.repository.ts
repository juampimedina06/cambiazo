import { Injectable } from '@nestjs/common';
import type { ParentStudentLink } from '../../domain/entities/parent-student-link.entity.js';
import type { ParentStudentLinkRepositoryPort } from '../../domain/ports/parent-student-link.repository.port.js';

@Injectable()
export class InMemoryParentStudentLinkRepository
  implements ParentStudentLinkRepositoryPort
{
  private readonly links = new Map<string, ParentStudentLink>();

  constructor() {
    if (process.env.NODE_ENV !== 'test') {
      this.seedDefault();
    }
  }

  public seedDefault(): void {
    const defaultLink: ParentStudentLink = {
      id: 'link-default-1',
      institutionId: 'e28bb18a-66fe-4f8e-9092-2df283f55001',
      parentUserId: '11111111-1111-4111-8111-111111111111',
      studentUserId: '22222222-2222-4222-8222-222222222222',
      createdAt: new Date(),
    };
    this.links.set(defaultLink.id, defaultLink);
  }

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
