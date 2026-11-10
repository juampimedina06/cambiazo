'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  Clock,
  GraduationCap,
} from 'lucide-react';
import { StudentRosterItem, ConsentStatus } from '@/shared/api/types';
import { apiClient } from '@/shared/api/api-client';
import { Surface } from '@/shared/ui/Surface';
import { StudentRow } from '@/entities/student';

const DEFAULT_SCHOOL_ID = 'e28bb18a-66fe-4f8e-9092-2df283f55001'; // Colegio Belgrano Day School

export default function SchoolStudentsPage() {
  const [students, setStudents] = useState<StudentRosterItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ConsentStatus>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const activeId =
        typeof window !== 'undefined'
          ? localStorage.getItem('cambiazo_institution_id') || DEFAULT_SCHOOL_ID
          : DEFAULT_SCHOOL_ID;
      const data = await apiClient.getStudentsRoster(activeId);
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students roster:', err);
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
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentDni.includes(searchQuery) ||
      s.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.grade.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || s.consentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Metrics
  const totalStudents = students.length;
  const grantedCount = students.filter((s) => s.consentStatus === 'GRANTED').length;
  const pendingCount = students.filter((s) => s.consentStatus === 'PENDING').length;
  const revokedCount = students.filter((s) => s.consentStatus === 'REVOKED').length;

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

      {/* Metrics Row (NO CARD-IN-CARD) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Consentimiento Otorgado
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 tabular-nums mt-0.5">
              {grantedCount}{' '}
              <span className="text-xs text-text-secondary font-normal">
                alumnos habilitados
              </span>
            </div>
          </div>
        </Surface>

        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Firma Pendiente
            </span>
            <div className="text-2xl font-extrabold text-amber-600 tabular-nums mt-0.5">
              {pendingCount}{' '}
              <span className="text-xs text-text-secondary font-normal">
                en espera de tutor
              </span>
            </div>
          </div>
        </Surface>

        <Surface className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Consentimiento Revocado
            </span>
            <div className="text-2xl font-extrabold text-rose-600 tabular-nums mt-0.5">
              {revokedCount}{' '}
              <span className="text-xs text-text-secondary font-normal">
                cuentas bloqueadas
              </span>
            </div>
          </div>
        </Surface>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            placeholder="Buscar por alumno, DNI, grado o tutor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-slate-200 rounded-xl text-sm text-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                statusFilter === item.id
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-surface text-text-secondary hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table / Flat List inside Surface (NO CARD-IN-CARD) */}
      <Surface>
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Nómina de Alumnos y Familias ({filteredStudents.length})
          </span>
          <span className="text-xs text-text-secondary font-medium">
            Ley 25.326 — Trazabilidad de Consentimiento y Billetera
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-text-secondary text-sm">
            Cargando nómina de alumnos...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <GraduationCap size={36} className="text-slate-300" />
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
      </Surface>
    </div>
  );
}
