import { Injectable } from '@nestjs/common';
import {
  isPersistenceDisabled,
  readJsonDataFile,
  writeJsonDataFile,
} from '../../../../common/persistence/json-file-store.js';
import type { User } from '../../domain/entities/user.entity.js';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port.js';

const STORAGE_FILE = 'users.json';

@Injectable()
export class InMemoryUserRepository implements UserRepositoryPort {
  private readonly users = new Map<string, User>();

  constructor() {
    if (!isPersistenceDisabled()) {
      this.seedDefault();
      this.loadFromDisk();
    }
  }

  private loadFromDisk(): void {
    const parsed = readJsonDataFile<User[]>(STORAGE_FILE);
    if (!parsed) return;
    for (const item of parsed) {
      this.users.set(item.id, {
        ...item,
        createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt),
      });
    }
  }

  private saveToDisk(): void {
    writeJsonDataFile(STORAGE_FILE, Array.from(this.users.values()));
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
