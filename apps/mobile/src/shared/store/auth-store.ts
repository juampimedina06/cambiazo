import { type ConsentStatus, type UserRole } from '@cambiazo/shared';
import {
  hydrateStudentAccountAction,
  registerApiAuthProvider,
  type ParentProfile,
  type SchoolInstitution,
  type StudentProfile,
} from '../../core';

export interface AuthState {
  currentRole: UserRole | null;
  institution: SchoolInstitution | null;
  parent: ParentProfile | null;
  student: StudentProfile | null;
  students: StudentProfile[];
}

type Listener = (state: AuthState) => void;

const SESSION_STORAGE_KEY = 'cambiazo_mobile_auth_session_v1';

interface WebStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getWebSessionStorage(): WebStorageLike | null {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return null;
  }
  const host = globalThis as unknown as { sessionStorage?: WebStorageLike };
  return host?.sessionStorage ?? null;
}

class AuthStore {
  private state: AuthState = {
    currentRole: null,
    institution: null,
    parent: null,
    student: null,
    students: [],
  };

  private listeners: Set<Listener> = new Set();

  constructor() {
    this.restoreSession();
    registerApiAuthProvider(() => ({
      role: this.state.currentRole,
      userId:
        this.state.currentRole === 'PARENT'
          ? this.state.parent?.id
          : this.state.student?.id,
      institutionId:
        this.state.student?.institutionId ||
        this.state.parent?.institutionId ||
        this.state.institution?.id,
    }));
  }

  private restoreSession() {
    try {
      const storage = getWebSessionStorage();
      const raw = storage?.getItem(SESSION_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<AuthState>;
      if (parsed && typeof parsed === 'object') {
        this.state = {
          currentRole: parsed.currentRole ?? null,
          institution: parsed.institution ?? null,
          parent: parsed.parent ?? null,
          student: parsed.student ?? null,
          students: Array.isArray(parsed.students) ? parsed.students : [],
        };
      }
    } catch {
      // Ignore corrupt session storage payload
    }
  }

  private persistSession() {
    try {
      const storage = getWebSessionStorage();
      if (!storage) return;
      if (
        !this.state.currentRole &&
        !this.state.institution &&
        !this.state.parent &&
        !this.state.student
      ) {
        storage.removeItem(SESSION_STORAGE_KEY);
        return;
      }
      storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore storage quota or security errors
    }
  }

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
    this.persistSession();
    this.listeners.forEach((listener) => listener(this.state));
  }

  public setInstitution(institution: SchoolInstitution) {
    this.state = {
      ...this.state,
      institution,
    };
    this.notify();
  }

  public setParentSession(
    parent: ParentProfile,
    student?: StudentProfile,
    allStudents?: StudentProfile[],
    institution?: SchoolInstitution | null
  ) {
    const resolvedList =
      allStudents && allStudents.length > 0
        ? allStudents
        : student
        ? [student]
        : [];
    this.state = {
      ...this.state,
      currentRole: 'PARENT',
      institution:
        institution !== undefined ? institution : this.state.institution,
      parent,
      student: student ?? resolvedList[0] ?? null,
      students: resolvedList,
    };
    this.notify();
  }

  public selectStudent(studentId: string) {
    const found = this.state.students.find((s) => s.id === studentId);
    if (found) {
      this.state = {
        ...this.state,
        student: { ...found },
      };
      this.notify();
    }
  }

  public setStudentSession(
    student: StudentProfile,
    institution?: SchoolInstitution | null
  ) {
    this.state = {
      ...this.state,
      currentRole: 'STUDENT',
      institution:
        institution !== undefined ? institution : this.state.institution,
      parent: null,
      student,
      students: [student],
    };
    this.notify();
  }

  public updateStudentFields(
    studentId: string,
    patch: Partial<StudentProfile>
  ) {
    const updatedList = this.state.students.map((s) =>
      s.id === studentId ? { ...s, ...patch } : s
    );
    const updatedCurrent =
      this.state.student && this.state.student.id === studentId
        ? { ...this.state.student, ...patch }
        : this.state.student;

    this.state = {
      ...this.state,
      student: updatedCurrent,
      students: updatedList,
    };
    this.notify();
  }

  public updateStudentConsent(status: ConsentStatus, studentId?: string) {
    const targetId = studentId || this.state.student?.id;
    if (this.state.student && (!targetId || this.state.student.id === targetId)) {
      const updatedStudent: StudentProfile = {
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
    } else if (targetId) {
      const updatedList = this.state.students.map((s) =>
        s.id === targetId ? { ...s, consentStatus: status } : s
      );
      this.state = {
        ...this.state,
        students: updatedList,
      };
      this.notify();
    }
  }

  public async refreshStudentFromBackend(studentId: string): Promise<void> {
    const target =
      this.state.students.find((s) => s.id === studentId) || this.state.student;
    if (!target) return;

    const role: 'PARENT' | 'STUDENT' =
      this.state.currentRole === 'PARENT' ? 'PARENT' : 'STUDENT';
    const userId =
      role === 'PARENT'
        ? this.state.parent?.id || target.parentId
        : target.id;

    const hydrated = await hydrateStudentAccountAction(target, {
      role,
      userId,
      institutionId: target.institutionId || this.state.institution?.id,
    });

    this.updateStudentFields(hydrated.id, hydrated);
  }

  public async refreshCurrentStudent(): Promise<void> {
    const studentId = this.state.student?.id;
    if (!studentId) return;
    await this.refreshStudentFromBackend(studentId);
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

export function resolveSessionContext(state: AuthState): {
  student: StudentProfile | null;
  studentId: string;
  parent: ParentProfile | null;
  institution: SchoolInstitution | null;
  institutionId: string;
  institutionName: string;
} {
  const student = state.student;
  const institution = state.institution;

  return {
    student,
    studentId: student?.id || '',
    parent: state.parent,
    institution,
    institutionId: student?.institutionId || institution?.id || '',
    institutionName: institution?.name || 'Institución Escolar',
  };
}
