import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { User } from '../../domain/entities/user.entity.js';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port.js';

@Injectable()
export class InMemoryUserRepository implements UserRepositoryPort {
  private readonly users = new Map<string, User>();
  private readonly storageFile = path.resolve(process.cwd(), '.data', 'users.json');

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
        const parsed = JSON.parse(raw) as Array<User & { createdAt: string }>;
        for (const item of parsed) {
          this.users.set(item.id, {
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
        JSON.stringify(Array.from(this.users.values()), null, 2),
        'utf-8',
      );
    } catch {
      // Ignore disk write errors in dev
    }
  }

  public seedDefault(): void {
    const institutionId = 'e28bb18a-66fe-4f8e-9092-2df283f55001';
    const createdAt = new Date();
    const defaultParent: User = {
      id: '11111111-1111-4111-8111-111111111111',
      institutionId,
      role: 'PARENT',
      email: 'carolina.gomez@ejemplo.com',
      passwordHash: 'hash_default',
      fullName: 'Carolina Gómez',
      dni: '32109876',
      phone: '+5491122334455',
      isActive: true,
      createdAt,
    };
    const defaultStudent: User = {
      id: '22222222-2222-4222-8222-222222222222',
      institutionId,
      role: 'STUDENT',
      email: 'mateo.gomez@student.cambiazo.internal',
      passwordHash: 'hash_default',
      fullName: 'Mateo Gómez',
      dni: '52345678',
      grade: '6° Primaria',
      dateOfBirth: '2014-05-12',
      isActive: true,
      createdAt,
    };
    this.users.set(defaultParent.id, defaultParent);
    this.users.set(defaultStudent.id, defaultStudent);
  }

  async findAllByInstitution(institutionId: string): Promise<User[]> {
    const results: User[] = [];
    for (const u of this.users.values()) {
      if (u.institutionId === institutionId) {
        results.push({ ...u });
      }
    }
    return results;
  }

  async create(user: User): Promise<User> {
    const clone = { ...user };
    this.users.set(clone.id, clone);
    this.saveToDisk();
    return clone;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === normalized) {
        return { ...u };
      }
    }
    return null;
  }

  async findByDniAndInstitution(dni: string, institutionId: string): Promise<User | null> {
    const normalizedDni = dni.trim();
    for (const u of this.users.values()) {
      if (u.dni === normalizedDni && u.institutionId === institutionId) {
        return { ...u };
      }
    }
    return null;
  }

  async updateIsActive(id: string, isActive: boolean): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.isActive = isActive;
      this.saveToDisk();
    }
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.passwordHash = passwordHash;
      this.saveToDisk();
    }
  }

  async countActiveStudentsByInstitution(institutionId: string): Promise<number> {
    let count = 0;
    for (const u of this.users.values()) {
      if (u.institutionId === institutionId && u.role === 'STUDENT' && u.isActive) {
        count += 1;
      }
    }
    return count;
  }

  // Clear helper for tests
  clear(): void {
    this.users.clear();
  }
}
