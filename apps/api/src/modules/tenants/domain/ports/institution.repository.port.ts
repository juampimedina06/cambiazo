import type { Institution } from '../entities/institution.entity.js';

export interface InstitutionRepositoryPort {
  create(institution: Institution): Promise<Institution>;
  findById(id: string): Promise<Institution | null>;
  findByCuit(cuit: string): Promise<Institution | null>;
  findAll(): Promise<Institution[]>;
}

export const INSTITUTION_REPOSITORY = Symbol('INSTITUTION_REPOSITORY');
