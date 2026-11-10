import { describe, it, expect, beforeEach } from 'vitest';
import { mockApiClient } from '../src/shared/api/mock-client';

describe('Student Educational Savings Goals (WAVE-3-MOBILE-03)', () => {
  const studentId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    mockApiClient.resetToDefault();
  });

  it('retrieves default seeded educational savings goals for student', () => {
    const goals = mockApiClient.getSavingsGoals(studentId);
    expect(goals.length).toBe(2);

    const bookGoal = goals.find((g) => g.title.includes('Libro'));
    expect(bookGoal).toBeDefined();
    expect(bookGoal?.targetAmountCents).toBe(300000); // $3.000
    expect(bookGoal?.savedAmountCents).toBe(180000);  // $1.800
    expect(bookGoal?.icon).toBe('📚');
  });

  it('creates a new savings goal with valid parameters', async () => {
    const createRes = await mockApiClient.createSavingsGoal(studentId, {
      title: 'Kit de Geometría Técnico',
      targetAmountCents: 150000, // $1.500
      icon: '📐',
    });

    expect(createRes.success).toBe(true);
    expect(createRes.goal?.title).toBe('Kit de Geometría Técnico');
    expect(createRes.goal?.targetAmountCents).toBe(150000);
    expect(createRes.goal?.savedAmountCents).toBe(0);
    expect(createRes.goal?.icon).toBe('📐');

    const updatedGoals = mockApiClient.getSavingsGoals(studentId);
    expect(updatedGoals.length).toBe(3);
  });

  it('rejects creating savings goals with invalid parameters', async () => {
    // Empty title
    const resEmptyTitle = await mockApiClient.createSavingsGoal(studentId, {
      title: ' ',
      targetAmountCents: 100000,
    });
    expect(resEmptyTitle.success).toBe(false);

    // Negative or zero target
    const resNegativeTarget = await mockApiClient.createSavingsGoal(studentId, {
      title: 'Almuerzo',
      targetAmountCents: -500,
    });
    expect(resNegativeTarget.success).toBe(false);

    // Non-existent student
    const resNoStudent = await mockApiClient.createSavingsGoal('00000000-0000-0000-0000-000000000000', {
      title: 'Almuerzo',
      targetAmountCents: 50000,
    });
    expect(resNoStudent.success).toBe(false);
  });

  it('allocates balance from student wallet to a goal within prepaid funds', async () => {
    const student = mockApiClient.getStudent(studentId)!;
    const initialBalance = student.balanceArsCents; // 450000 ($4.500)

    const goals = mockApiClient.getSavingsGoals(studentId);
    const goal = goals[0]!;
    const initialSaved = goal.savedAmountCents; // 180000 ($1.800)

    const allocateAmount = 50000; // $500
    const res = await mockApiClient.allocateToGoal(studentId, goal.id, allocateAmount);

    expect(res.success).toBe(true);
    expect(res.goal?.savedAmountCents).toBe(initialSaved + allocateAmount);

    // Student balance decreased by exactly allocateAmount
    expect(student.balanceArsCents).toBe(initialBalance - allocateAmount);
  });

  it('rejects allocating more balance than available in wallet', async () => {
    const student = mockApiClient.getStudent(studentId)!;
    const goals = mockApiClient.getSavingsGoals(studentId);
    const goal = goals[0]!;

    const excessiveAmount = student.balanceArsCents + 100000; // exceeds balance
    const res = await mockApiClient.allocateToGoal(studentId, goal.id, excessiveAmount);

    expect(res.success).toBe(false);
    expect(res.error).toContain('insuficiente');
  });

  it('withdraws saved money from goal back to available prepaid wallet balance', async () => {
    const student = mockApiClient.getStudent(studentId)!;
    const initialBalance = student.balanceArsCents;

    const goals = mockApiClient.getSavingsGoals(studentId);
    const goal = goals[0]!;
    const initialSaved = goal.savedAmountCents;

    const withdrawAmount = 50000; // $500
    const res = await mockApiClient.withdrawFromGoal(studentId, goal.id, withdrawAmount);

    expect(res.success).toBe(true);
    expect(res.goal?.savedAmountCents).toBe(initialSaved - withdrawAmount);

    // Student balance restored
    expect(student.balanceArsCents).toBe(initialBalance + withdrawAmount);
  });

  it('rejects withdrawing more money than saved in the goal', async () => {
    const goals = mockApiClient.getSavingsGoals(studentId);
    const goal = goals[0]!;

    const excessiveWithdraw = goal.savedAmountCents + 50000;
    const res = await mockApiClient.withdrawFromGoal(studentId, goal.id, excessiveWithdraw);

    expect(res.success).toBe(false);
    expect(res.error).toContain('supera lo ahorrado');
  });

  it('strictly preserves the rule that savings remain within prepaid kiosk balance', () => {
    // Total school assets = wallet balance + total in savings goals
    const student = mockApiClient.getStudent(studentId)!;
    const goals = mockApiClient.getSavingsGoals(studentId);

    const totalBefore = student.balanceArsCents + goals.reduce((acc, g) => acc + g.savedAmountCents, 0);

    // After allocating $500
    mockApiClient.allocateToGoal(studentId, goals[0]!.id, 50000);
    const totalAfterAllocate = student.balanceArsCents + goals.reduce((acc, g) => acc + g.savedAmountCents, 0);
    expect(totalAfterAllocate).toBe(totalBefore);

    // After withdrawing $300
    mockApiClient.withdrawFromGoal(studentId, goals[0]!.id, 30000);
    const totalAfterWithdraw = student.balanceArsCents + goals.reduce((acc, g) => acc + g.savedAmountCents, 0);
    expect(totalAfterWithdraw).toBe(totalBefore);
  });
});
