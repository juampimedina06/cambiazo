import {
  type ConsentStatus,
  type UserRole,
} from '@cambiazo/shared';
import {
  type MockInstitution,
  type MockParentUser,
  type MockStudentUser,
  mockApiClient,
} from '../api/mock-client.js';

export interface AuthState {
  currentRole: UserRole | null;
  institution: MockInstitution | null;
  parent: MockParentUser | null;
  student: MockStudentUser | null;
}

type Listener = (state: AuthState) => void;

class AuthStore {
  private state: AuthState = {
    currentRole: null,
    institution: null,
    parent: null,
    student: null,
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

  public setParentSession(parent: MockParentUser, student?: MockStudentUser) {
    this.state = {
      ...this.state,
      currentRole: 'PARENT',
      parent,
      student: student ?? this.state.student,
    };
    this.notify();
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
      this.state = {
        ...this.state,
        student: updatedStudent,
      };
      this.notify();
    }
  }

  public refreshStudentFromClient(studentId: string) {
    const s = mockApiClient.getStudent(studentId);
    if (s) {
      this.state = {
        ...this.state,
        student: s,
      };
      this.notify();
    }
  }

  public logout() {
    this.state = {
      currentRole: null,
      institution: null,
      parent: null,
      student: null,
    };
    this.notify();
  }
}

export const authStore = new AuthStore();
