import { Injectable } from '@nestjs/common';
import {
  isPersistenceDisabled,
  readJsonDataFile,
  writeJsonDataFile,
} from '../../../../common/persistence/json-file-store.js';
import type { Institution } from '../../domain/entities/institution.entity.js';
import type { InstitutionRepositoryPort } from '../../domain/ports/institution.repository.port.js';

const STORAGE_FILE = 'institutions.json';

@Injectable()
export class InMemoryInstitutionRepository implements InstitutionRepositoryPort {
  private readonly institutions = new Map<string, Institution>();

  constructor() {
    if (!isPersistenceDisabled()) {
      this.seedDefault();
      this.loadFromDisk();
    }
  }

  private loadFromDisk(): void {
    const parsed = readJsonDataFile<Institution[]>(STORAGE_FILE);
    if (!parsed) return;
    for (const item of parsed) {
      this.institutions.set(item.id, {
        ...item,
        createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt),
      });
    }
  }

  private saveToDisk(): void {
    writeJsonDataFile(STORAGE_FILE, Array.from(this.institutions.values()));
  }

  public seedDefault(): void {
    const institutionsList: Institution[] = [
      {
        id: 'e28bb18a-66fe-4f8e-9092-2df283f55001',
        name: 'Colegio Manuel Belgrano',
        cuit: '30-71234567-9',
        address: 'Av. Belgrano 1450, CABA',
        billingPlanType: 'FIXED_MONTHLY',
        monthlyFeeCents: 25000000,
        status: 'ACTIVE',
        createdAt: new Date(),
      },
      {
        id: 'f39cc29b-77fa-5a9f-8183-3ef394f66002',
        name: 'Instituto San Martín',
        cuit: '30-68910112-3',
        address: 'Calle San Martín 820, Córdoba',
        billingPlanType: 'PER_ACTIVE_STUDENT',
        monthlyFeeCents: 120000,
        status: 'ACTIVE',
        createdAt: new Date(),
      },
      {
        id: 'a10dd30c-88ab-6b0a-9294-4fa405f77003',
        name: 'Escuela Normal N° 1',
        cuit: '30-55443322-1',
        address: 'Bv. Oroño 310, Rosario',
        billingPlanType: 'FIXED_MONTHLY',
        monthlyFeeCents: 18000000,
        status: 'ACTIVE',
        createdAt: new Date(),
      },
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Colegio Belgrano Day School',
        cuit: '30-11223344-5',
        address: 'Juramento 2100, CABA',
        billingPlanType: 'FIXED_MONTHLY',
        monthlyFeeCents: 4500000,
        status: 'ACTIVE',
        createdAt: new Date(),
      },
    ];
    for (const inst of institutionsList) {
      this.institutions.set(inst.id, inst);
    }
  }

  async create(institution: Institution): Promise<Institution> {
    const clone = { ...institution };
    this.institutions.set(clone.id, clone);
    this.saveToDisk();
    return clone;
  }

  async findById(id: string): Promise<Institution | null> {
    this.loadFromDisk();
    const institution = this.institutions.get(id);
    return institution ? { ...institution } : null;
  }

  async findByCuit(cuit: string): Promise<Institution | null> {
    this.loadFromDisk();
    for (const inst of this.institutions.values()) {
      if (inst.cuit === cuit) {
        return { ...inst };
      }
    }
    return null;
  }

  async findAll(): Promise<Institution[]> {
    this.loadFromDisk();
    return Array.from(this.institutions.values()).map((inst) => ({ ...inst }));
  }

  // Clear helper for tests
  clear(): void {
    this.institutions.clear();
  }
}
