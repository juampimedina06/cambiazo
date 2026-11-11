import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  allocateToSavingsGoalAction,
  createSavingsGoalAction,
  fetchSavingsGoalsAction,
  withdrawFromSavingsGoalAction,
} from '../src/core';
import {
  installTestBackend,
  TEST_STUDENT_ID,
  type TestBackendState,
} from './helpers/test-backend';

describe('Student Educational Savings Goals (WAVE-3-MOBILE-03)', () => {
  const studentId = TEST_STUDENT_ID;
  let backendState: TestBackendState;
  let restoreFetch: (() => void) | null = null;

  beforeEach(() => {
    const setup = installTestBackend();
    backendState = setup.state;
    restoreFetch = setup.restore;
  });

  afterEach(() => {
    restoreFetch?.();
  });

  it('retrieves default seeded educational savings goals for student', async () => {
    const goals = await fetchSavingsGoalsAction(studentId);
    expect(goals.length).toBe(2);

    const bookGoal = goals.find((g) => g.title.includes('Libro'));
    expect(bookGoal).toBeDefined();
    expect(bookGoal?.targetAmountCents).toBe(300000);
    expect(bookGoal?.savedAmountCents).toBe(180000);
    expect(bookGoal?.icon).toBe('book');
  });

  it('creates a new savings goal with valid parameters', async () => {
    const createRes = await createSavingsGoalAction({
      studentId,
      title: 'Kit de Geometría Técnico',
      targetAmountCents: 150000,
      icon: 'target',
    });

    expect(createRes.success).toBe(true);
    expect(createRes.goal?.title).toBe('Kit de Geometría Técnico');
    expect(createRes.goal?.targetAmountCents).toBe(150000);
    expect(createRes.goal?.savedAmountCents).toBe(0);

    const updatedGoals = await fetchSavingsGoalsAction(studentId);
    expect(updatedGoals.length).toBe(3);
  });

  it('rejects creating savings goals with invalid parameters', async () => {
    const resEmptyTitle = await createSavingsGoalAction({
      studentId,
      title: ' ',
      targetAmountCents: 100000,
    });
    expect(resEmptyTitle.success).toBe(false);

    const resNegativeTarget = await createSavingsGoalAction({
      studentId,
      title: 'Almuerzo',
      targetAmountCents: -500,
    });
    expect(resNegativeTarget.success).toBe(false);

    const resNoStudent = await createSavingsGoalAction({
      studentId: '00000000-0000-0000-0000-000000000000',
      title: 'Almuerzo',
      targetAmountCents: 50000,
    });
    expect(resNoStudent.success).toBe(false);
  });

  it('allocates balance from student wallet to a goal within prepaid funds', async () => {
    const student = backendState.students.get(studentId)!;
    const initialBalance = student.balanceArsCents;

    const goals = await fetchSavingsGoalsAction(studentId);
    const goal = goals[0]!;
    const initialSaved = goal.savedAmountCents;

    const allocateAmount = 50000;
    const res = await allocateToSavingsGoalAction({
      studentId,
      goalId: goal.id,
      amountCents: allocateAmount,
    });

    expect(res.success).toBe(true);
    expect(res.goal?.savedAmountCents).toBe(initialSaved + allocateAmount);
    expect(student.balanceArsCents).toBe(initialBalance - allocateAmount);
  });

  it('rejects allocating more balance than available in wallet', async () => {
    const student = backendState.students.get(studentId)!;
    const goals = await fetchSavingsGoalsAction(studentId);
    const goal = goals[0]!;

    const excessiveAmount = student.balanceArsCents + 100000;
    const res = await allocateToSavingsGoalAction({
      studentId,
      goalId: goal.id,
      amountCents: excessiveAmount,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Saldo insuficiente');
  });

  it('withdraws saved money from goal back to available prepaid wallet balance', async () => {
    const student = backendState.students.get(studentId)!;
    const initialBalance = student.balanceArsCents;

    const goals = await fetchSavingsGoalsAction(studentId);
    const goal = goals[0]!;
    const initialSaved = goal.savedAmountCents;

    const res = await withdrawFromSavingsGoalAction({
      studentId,
      goalId: goal.id,
    });

    expect(res.success).toBe(true);
    expect(res.goal?.savedAmountCents).toBe(0);
    expect(student.balanceArsCents).toBe(initialBalance + initialSaved);
  });

  it('strictly preserves the rule that savings remain within prepaid kiosk balance', async () => {
    const student = backendState.students.get(studentId)!;
    const goalsBefore = await fetchSavingsGoalsAction(studentId);
    const totalBefore =
      student.balanceArsCents +
      goalsBefore.reduce((acc, g) => acc + g.savedAmountCents, 0);

    await allocateToSavingsGoalAction({
      studentId,
      goalId: goalsBefore[0]!.id,
      amountCents: 50000,
    });
    const goalsMid = await fetchSavingsGoalsAction(studentId);
    const totalAfterAllocate =
      student.balanceArsCents +
      goalsMid.reduce((acc, g) => acc + g.savedAmountCents, 0);
    expect(totalAfterAllocate).toBe(totalBefore);

    await withdrawFromSavingsGoalAction({
      studentId,
      goalId: goalsMid[0]!.id,
    });
    const goalsAfter = await fetchSavingsGoalsAction(studentId);
    const totalAfterWithdraw =
      student.balanceArsCents +
      goalsAfter.reduce((acc, g) => acc + g.savedAmountCents, 0);
    expect(totalAfterWithdraw).toBe(totalBefore);
  });
});
