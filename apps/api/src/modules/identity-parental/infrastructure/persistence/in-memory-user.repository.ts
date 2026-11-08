import { Injectable } from '@nestjs/common';
import type { User } from '../../domain/entities/user.entity.js';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port.js';

@Injectable()
export class InMemoryUserRepository implements UserRepositoryPort {
  private readonly users = new Map<string, User>();

  async create(user: User): Promise<User> {
    const clone = { ...user };
    this.users.set(clone.id, clone);
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
