import type { User } from '../entities/user.entity.js';

export interface UserRepositoryPort {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByDniAndInstitution(dni: string, institutionId: string): Promise<User | null>;
  updateIsActive(id: string, isActive: boolean): Promise<void>;
  countActiveStudentsByInstitution(institutionId: string): Promise<number>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
