import { Injectable } from '@nestjs/common';
import {
  isPersistenceDisabled,
  readJsonDataFile,
  writeJsonDataFile,
} from '../../../../common/persistence/json-file-store.js';
import type { ParentStudentLink } from '../../domain/entities/parent-student-link.entity.js';
import type { ParentStudentLinkRepositoryPort } from '../../domain/ports/parent-student-link.repository.port.js';

const STORAGE_FILE = 'parent-student-links.json';

@Injectable()
export class InMemoryParentStudentLinkRepository
  implements ParentStudentLinkRepositoryPort
{
  private readonly links = new Map<string, ParentStudentLink>();

  constructor() {
    if (!isPersistenceDisabled()) {
      this.seedDefault();
      this.loadFromDisk();
    }
  }

  private loadFromDisk(): void {
    const parsed = readJsonDataFile<ParentStudentLink[]>(STORAGE_FILE);
    if (!parsed) return;
    for (const item of parsed) {
      this.links.set(item.id, {
        ...item,
        createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt),
      });
    }
  }

  private saveToDisk(): void {
    writeJsonDataFile(STORAGE_FILE, Array.from(this.links.values()));
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
    this.saveToDisk();
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
