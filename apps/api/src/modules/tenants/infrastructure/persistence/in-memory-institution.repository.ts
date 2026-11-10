import { Injectable } from '@nestjs/common';
import type { Institution } from '../../domain/entities/institution.entity.js';
import type { InstitutionRepositoryPort } from '../../domain/ports/institution.repository.port.js';

@Injectable()
export class InMemoryInstitutionRepository implements InstitutionRepositoryPort {
  private readonly institutions = new Map<string, Institution>();

  constructor() {
    if (process.env.NODE_ENV !== 'test') {
      this.seedDefault();
    }
  }

  private seedDefault(): void {
    const defaultInst: Institution = {
      id: 'e28bb18a-66fe-4f8e-9092-2df283f55001',
      name: 'Colegio Belgrano Day School',
      cuit: '30-11223344-5',
      address: 'Juramento 2100, CABA',
      billingPlanType: 'FIXED_MONTHLY',
      monthlyFeeCents: 4500000,
      status: 'ACTIVE',
      createdAt: new Date(),
    };
    const secondaryInst: Institution = {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'Colegio Belgrano Day School',
      cuit: '30-11223344-5',
      address: 'Juramento 2100, CABA',
      billingPlanType: 'FIXED_MONTHLY',
      monthlyFeeCents: 4500000,
      status: 'ACTIVE',
      createdAt: new Date(),
    };
    this.institutions.set(defaultInst.id, defaultInst);
    this.institutions.set(secondaryInst.id, secondaryInst);
  }

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
