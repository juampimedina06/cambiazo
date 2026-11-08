import type { ParentStudentLink } from '../entities/parent-student-link.entity.js';

export interface ParentStudentLinkRepositoryPort {
  create(link: ParentStudentLink): Promise<ParentStudentLink>;
  findLink(
    institutionId: string,
    parentUserId: string,
    studentUserId: string,
  ): Promise<ParentStudentLink | null>;
  findByParentId(parentUserId: string): Promise<ParentStudentLink[]>;
  findByStudentId(studentUserId: string): Promise<ParentStudentLink | null>;
}

export const PARENT_STUDENT_LINK_REPOSITORY = Symbol(
  'PARENT_STUDENT_LINK_REPOSITORY',
);
