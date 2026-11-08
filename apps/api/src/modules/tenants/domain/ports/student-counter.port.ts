export interface StudentCounterPort {
  countActiveStudents(institutionId: string): Promise<number>;
}

export const STUDENT_COUNTER_PORT = Symbol('STUDENT_COUNTER_PORT');
