import { test, expect } from '@playwright/test';
import { NatodiApiClient, BranchResponse } from '../../src/api/NatodiApiClient';
import { COMPANY_SLUG, SERVICES } from '../../src/fixtures/test-data';

test.describe('GET /branches/{slug}/slug', () => {
  test('resolves an active company by its public slug', async ({ request }) => {
    const api = new NatodiApiClient(request);

    const response = await api.getBranchBySlug(COMPANY_SLUG);
    expect(response.status()).toBe(200);

    const body = (await response.json()) as BranchResponse;
    expect(body.data.slug).toBe(COMPANY_SLUG);
    expect(body.data.is_active).toBe(true);

    const serviceTitles = body.data.services.map((s) => s.title);
    expect(serviceTitles).toEqual(expect.arrayContaining([SERVICES.haircut, SERVICES.beardTrim]));
    expect(body.data.employees.length).toBeGreaterThanOrEqual(1);
  });

  test('returns 404 for a slug that does not exist', async ({ request }) => {
    const api = new NatodiApiClient(request);

    const response = await api.getBranchBySlug('this-slug-does-not-exist-zz9');
    expect(response.status()).toBe(404);
  });
});
