import { test, expect } from '@playwright/test';
import { NatodiApiClient, BranchResponse, ServiceListResponse, serviceListResponseSchema } from '../../src/api/NatodiApiClient';
import { COMPANY_SLUG, SERVICES } from '../../src/fixtures/test-data';

test.describe('GET /services/', () => {
  test('response matches the expected schema', async ({ request }) => {
    const api = new NatodiApiClient(request);
    const branch = (await (await api.getBranchBySlug(COMPANY_SLUG)).json()) as BranchResponse;

    const response = await api.listServices({ companyId: branch.data.company.id, branchId: branch.data.id });
    const body = await response.json();

    expect(() => serviceListResponseSchema.parse(body)).not.toThrow();
  });

  test('lists the widget-visible services for a branch with correct price and duration', async ({ request }) => {
    const api = new NatodiApiClient(request);

    const branch = (await (await api.getBranchBySlug(COMPANY_SLUG)).json()) as BranchResponse;

    const response = await api.listServices({
      companyId: branch.data.company.id,
      branchId: branch.data.id,
    });
    expect(response.status()).toBe(200);

    const body = (await response.json()) as ServiceListResponse;
    const haircut = body.data.find((s) => s.title === SERVICES.haircut);
    const beardTrim = body.data.find((s) => s.title === SERVICES.beardTrim);

    expect(haircut).toBeDefined();
    expect(haircut?.price).toBe(700);
    expect(haircut?.duration).toBe(3600); // seconds — 1 hour

    expect(beardTrim).toBeDefined();
    expect(beardTrim?.price).toBe(300);
    expect(beardTrim?.duration).toBe(1800); // seconds — 30 minutes
  });
});
