import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ParentStudentLink } from '../../domain/entities/parent-student-link.entity.js';
import type { ParentStudentLinkRepositoryPort } from '../../domain/ports/parent-student-link.repository.port.js';

@Injectable()
export class InMemoryParentStudentLinkRepository
  implements ParentStudentLinkRepositoryPort
{
  private readonly links = new Map<string, ParentStudentLink>();
  private readonly storageFile = path.resolve(process.cwd(), '.data', 'parent-student-links.json');

  constructor() {
    if (process.env.NODE_ENV !== 'test') {
      this.seedDefault();
      this.loadFromDisk();
    }
  }

  private loadFromDisk(): void {
    if (process.env.NODE_ENV === 'test') return;
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf-8');
        const parsed = JSON.parse(raw) as Array<ParentStudentLink & { createdAt: string }>;
        for (const item of parsed) {
          this.links.set(item.id, {
            ...item,
            createdAt: new Date(item.createdAt),
          });
        }
      }
    } catch {
      // Ignore disk read errors in dev
    }
  }

  private saveToDisk(): void {
    if (process.env.NODE_ENV === 'test') return;
    try {
      const dir = path.dirname(this.storageFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.storageFile,
        JSON.stringify(Array.from(this.links.values()), null, 2),
        'utf-8',
      );
    } catch {
      // Ignore disk write errors in dev
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
