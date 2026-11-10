import {
  type ConsentStatus,
  type UserRole,
} from '@cambiazo/shared';
import {
  type MockInstitution,
  type MockParentUser,
  type MockStudentUser,
  mockApiClient,
} from '../api/mock-client';

export interface AuthState {
  currentRole: UserRole | null;
  institution: MockInstitution | null;
  parent: MockParentUser | null;
  student: MockStudentUser | null;
  students: MockStudentUser[];
}

type Listener = (state: AuthState) => void;

class AuthStore {
  private state: AuthState = {
    currentRole: null,
    institution: null,
    parent: null,
    student: null,
    students: [],
  };

  private listeners: Set<Listener> = new Set();

  public getState(): AuthState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  public setInstitution(institution: MockInstitution) {
    this.state = {
      ...this.state,
      institution,
    };
    this.notify();
  }

  public setParentSession(
    parent: MockParentUser,
    student?: MockStudentUser,
    allStudents?: MockStudentUser[]
  ) {
    const resolvedList =
      allStudents && allStudents.length > 0
        ? allStudents
        : student
        ? [student]
        : this.state.students;
    this.state = {
      ...this.state,
      currentRole: 'PARENT',
      parent,
      student: student ?? resolvedList[0] ?? this.state.student,
      students: resolvedList,
    };
    this.notify();
  }

  public selectStudent(studentId: string) {
    const found =
      this.state.students.find((s) => s.id === studentId) ||
      mockApiClient.getStudent(studentId);
    if (found) {
      this.state = {
        ...this.state,
        student: { ...found },
      };
      this.notify();
    }
  }

  public setStudentSession(student: MockStudentUser) {
    this.state = {
      ...this.state,
      currentRole: 'STUDENT',
      student,
    };
    this.notify();
  }

  public updateStudentConsent(status: ConsentStatus) {
    if (this.state.student) {
      const updatedStudent: MockStudentUser = {
        ...this.state.student,
        consentStatus: status,
      };
      const updatedList = this.state.students.map((s) =>
        s.id === updatedStudent.id ? updatedStudent : s
      );
      this.state = {
        ...this.state,
        student: updatedStudent,
        students: updatedList,
      };
      this.notify();
    }
  }

  public refreshStudentFromClient(studentId: string) {
    const s = mockApiClient.getStudent(studentId);
    if (s) {
      const updatedList = this.state.students.map((item) =>
        item.id === s.id ? { ...s } : item
      );
      this.state = {
        ...this.state,
        student: { ...s },
        students: updatedList,
      };
      this.notify();
    }
  }

  public refreshCurrentStudent() {
    const studentId = this.state.student?.id || '22222222-2222-4222-8222-222222222222';
    this.refreshStudentFromClient(studentId);
  }

  public logout() {
    this.state = {
      currentRole: null,
      institution: null,
      parent: null,
      student: null,
      students: [],
    };
    this.notify();
  }
}

export const authStore = new AuthStore();
