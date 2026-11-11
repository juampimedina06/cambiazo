'use client';

import React, { useEffect, useState } from 'react';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  Clock,
  GraduationCap,
} from 'lucide-react';
import { StudentRosterItem, ConsentStatus } from '@/shared/api/types';
import { apiClient } from '@/shared/api/api-client';
import { getActiveInstitutionId } from '@/shared/api/tenant';
import { Button } from '@/shared/ui/Button';
import { StudentRow } from '@/entities/student';

export default function SchoolStudentsPage() {
  const [students, setStudents] = useState<StudentRosterItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ConsentStatus>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadStudents = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await apiClient.getStudentsRoster(getActiveInstitutionId());
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load students roster:', err);
      setApiError(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar la nómina de alumnos.'
      );
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleUpdateConsent = async (
    studentId: string,
    status: ConsentStatus,
    reason?: string
  ) => {
    try {
      const updated = await apiClient.updateStudentConsent(studentId, status, reason);
      setStudents((prev) =>
        prev.map((s) => (s.studentId === studentId ? updated : s))
      );
    } catch (err) {
      console.error('Failed to update consent:', err);
    }
  };

  // Filtered students
  const studentList = Array.isArray(students) ? students : [];
  const filteredStudents = studentList.filter((s) => {
    if (!s) return false;
    const name = (s.studentName || (s as any).fullName || (s as any).name || '').toLowerCase();
    const dni = (s.studentDni || (s as any).dni || '');
    const parentName = (s.parentName || (s as any).guardianName || '').toLowerCase();
    const parentEmail = (s.parentEmail || (s as any).email || '').toLowerCase();
    const grade = (s.grade || '').toLowerCase();
    const q = (searchQuery || '').toLowerCase();

    const matchesSearch =
      name.includes(q) ||
      dni.includes(searchQuery) ||
      parentName.includes(q) ||
      parentEmail.includes(q) ||
      grade.includes(q);

    const matchesStatus =
      statusFilter === 'ALL' || s.consentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Metrics
  const totalStudents = studentList.length;
  const grantedCount = studentList.filter((s) => s?.consentStatus === 'GRANTED').length;
  const pendingCount = studentList.filter((s) => s?.consentStatus === 'PENDING').length;
  const revokedCount = studentList.filter((s) => s?.consentStatus === 'REVOKED').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          Nómina de Alumnos y Consentimiento Parental
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Auditoría de consentimiento bajo la Ley 25.326. Ningún alumno sin consentimiento otorgado puede operar en el kiosco.
        </p>
      </div>

      {/* Open Editorial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border-y border-slate-200/70 dark:border-white/[0.08] divide-y sm:divide-y-0 sm:divide-x divide-slate-200/70 dark:divide-white/[0.08]">
        <div className="py-4 sm:pr-6 flex items-center gap-3.5">
          <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Consentimiento Otorgado
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
              {grantedCount}{' '}
              <span className="text-xs text-text-secondary font-normal">
                alumnos habilitados
              </span>
            </div>
          </div>
        </div>

        <div className="py-4 sm:px-6 flex items-center gap-3.5">
          <Clock size={20} className="text-amber-600 dark:text-amber-300 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Firma Pendiente
            </span>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-300 tabular-nums mt-0.5">
              {pendingCount}{' '}
              <span className="text-xs text-text-secondary font-normal">
                en espera de tutor
              </span>
            </div>
          </div>
        </div>

        <div className="py-4 sm:pl-6 flex items-center gap-3.5">
          <ShieldAlert size={20} className="text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Consentimiento Revocado
            </span>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
              {revokedCount}{' '}
              <span className="text-xs text-text-secondary font-normal">
                cuentas bloqueadas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Buscar alumno, curso o tutor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 liquid-glass-subtle rounded-2xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/60 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 liquid-glass-subtle p-1 rounded-full flex-wrap">
          {(
            [
              { id: 'ALL', label: 'Todos' },
              { id: 'GRANTED', label: 'Otorgados' },
              { id: 'PENDING', label: 'Pendientes' },
              { id: 'REVOKED', label: 'Revocados' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                statusFilter === item.id
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Open List directly on canvas */}
      <section className="border-t border-slate-200/70 dark:border-white/[0.08]">
        <div className="py-3.5 border-b border-slate-200/60 dark:border-white/[0.07] flex justify-between items-center">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Alumnos ({filteredStudents.length})
          </span>
          <span className="text-xs text-text-muted font-medium">
            Consentimiento Ley 25.326
          </span>
        </div>

        {apiError ? (
          <div className="py-10 text-center flex flex-col items-center gap-3">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {apiError}
            </p>
            <Button size="sm" variant="outline" onClick={loadStudents}>
              Reintentar
            </Button>
          </div>
        ) : isLoading ? (
          <div className="py-12 text-center text-text-secondary text-sm">
            Cargando nómina de alumnos...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
            <GraduationCap size={36} className="text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-text-primary text-base">
              No se encontraron alumnos
            </p>
            <p className="text-xs text-text-secondary max-w-sm">
              Ningún alumno coincide con los filtros de búsqueda o estado de consentimiento seleccionados.
            </p>
          </div>
        ) : (
          <div>
            {filteredStudents.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                onUpdateConsent={handleUpdateConsent}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
