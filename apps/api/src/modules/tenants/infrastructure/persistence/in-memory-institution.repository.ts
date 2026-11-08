import { Injectable } from '@nestjs/common';
import type { Institution } from '../../domain/entities/institution.entity.js';
import type { InstitutionRepositoryPort } from '../../domain/ports/institution.repository.port.js';

@Injectable()
export class InMemoryInstitutionRepository implements InstitutionRepositoryPort {
  private readonly institutions = new Map<string, Institution>();

  async create(institution: Institution): Promise<Institution> {
    const clone = { ...institution };
    this.institutions.set(clone.id, clone);
    return clone;
  }

  async findById(id: string): Promise<Institution | null> {
    const institution = this.institutions.get(id);
    return institution ? { ...institution } : null;
  }

  async findByCuit(cuit: string): Promise<Institution | null> {
    for (const inst of this.institutions.values()) {
      if (inst.cuit === cuit) {
        return { ...inst };
      }
    }
    return null;
  }

  async findAll(): Promise<Institution[]> {
    return Array.from(this.institutions.values()).map((inst) => ({ ...inst }));
  }

  // Clear helper for tests
  clear(): void {
    this.institutions.clear();
  }
}
