import { test, expect, request as playwrightRequest } from '@playwright/test';
import { BookingWidgetPage } from '../../src/pages/BookingWidgetPage';
import { NatodiApiClient } from '../../src/api/NatodiApiClient';
import { COMPANY_SLUG, SERVICES, randomClientName, randomValidPhone } from '../../src/fixtures/test-data';
import { resolveNextSlot } from '../../src/utils/resolveNextSlot';
import { API_BASE_URL } from '../../src/config';

test.describe('Client books a service — negative cases', () => {
  test('an invalid phone number keeps the "Записатись" button disabled', async ({ page }) => {
    const widget = new BookingWidgetPage(page, COMPANY_SLUG);
    const client = randomClientName('Invalid');

    await widget.pickServiceAndFirstSlot(SERVICES.haircut);
    await widget.goToContactStep();

    // Two digits is not a valid UA mobile number — the widget must not allow submitting it.
    await widget.fillContactDetails({ firstName: client.firstName, phone: '12' });

    await expect(widget.submitBookingButton).toBeDisabled();
  });

  test('a slot that just got booked is no longer offered to the next client', async ({ page }) => {
    const apiContext = await playwrightRequest.newContext({ baseURL: API_BASE_URL });
    const api = new NatodiApiClient(apiContext);

    // Books the *last* nearest slot so this never collides with the happy-path test (which takes the first).
    const { branch, service, employee, nearestSlotsIso } = await resolveNextSlot(api, COMPANY_SLUG, SERVICES.haircut);
    const targetSlotIso = nearestSlotsIso.at(-1);
    expect(targetSlotIso, 'expected at least one bookable slot for the employee').toBeDefined();
    const targetTimeLabel = targetSlotIso!.slice(11, 16); // "HH:MM"

    const client = randomClientName('Blocker');
    const createdClient = await (
      await api.createClient({
        first_name: client.firstName,
        last_name: client.lastName,
        email: '',
        phone_number: randomValidPhone(),
        instagram: '',
        telegram: '',
        company_id: branch.company.id,
      })
    ).json();

    const bookResponse = await api.createAppointment({
      branch_id: branch.id,
      company_id: branch.company.id,
      client_id: createdClient.data.id,
      employee_id: employee.id,
      start_at: `${targetSlotIso}.000Z`,
      services: [{ service_id: service.id, quantity: 1 }],
      price: service.price,
      duration: service.duration,
      client_note: null,
    });
    expect(bookResponse.status()).toBe(200);
    await apiContext.dispose();

    const widget = new BookingWidgetPage(page, COMPANY_SLUG);
    await widget.open();
    await widget.openServiceStep();
    await widget.addService(SERVICES.haircut);
    await widget.goToEmployeeStep();

    await expect(widget.timeSlotButtons().first()).toBeVisible();
    expect(await widget.isSlotAvailable(targetTimeLabel)).toBe(false);
  });
});
