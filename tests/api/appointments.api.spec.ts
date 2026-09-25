import { test, expect } from '@playwright/test';
import { NatodiApiClient } from '../../src/api/NatodiApiClient';
import { COMPANY_SLUG, SERVICES } from '../../src/fixtures/test-data';
import { resolveNextSlot } from '../../src/utils/resolveNextSlot';

test.describe('POST /appointments/validate', () => {
  test('accepts a slot within the employee working hours', async ({ request }) => {
    const api = new NatodiApiClient(request);
    const { branch, service, employee, nearestSlotsIso } = await resolveNextSlot(api, COMPANY_SLUG, SERVICES.haircut);

    const response = await api.validateAppointment({
      branch_id: branch.id,
      company_id: branch.company.id,
      employee_id: employee.id,
      start_at: `${nearestSlotsIso[0]}.000Z`,
      services: [{ service_id: service.id, quantity: 1 }],
      price: service.price,
      duration: service.duration,
      client_note: null,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.message).toMatch(/valid/i);
  });

  test('rejects a slot in the past with a descriptive error', async ({ request }) => {
    const api = new NatodiApiClient(request);
    const { branch, service, employee } = await resolveNextSlot(api, COMPANY_SLUG, SERVICES.haircut);

    const response = await api.validateAppointment({
      branch_id: branch.id,
      company_id: branch.company.id,
      employee_id: employee.id,
      start_at: '2020-01-01T09:00:00.000Z',
      services: [{ service_id: service.id, quantity: 1 }],
      price: service.price,
      duration: service.duration,
      client_note: null,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.detail.error_code).toBeDefined();
    expect(body.detail.message).toContain('not working');
  });
});
