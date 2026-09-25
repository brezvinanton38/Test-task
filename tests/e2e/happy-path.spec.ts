import { test, expect } from '@playwright/test';
import { BookingWidgetPage } from '../../src/pages/BookingWidgetPage';
import { COMPANY_SLUG, SERVICES, randomClientName, randomValidPhone } from '../../src/fixtures/test-data';

test.describe('Client books a service — happy path', () => {
  test('select service → select time slot → confirm → sees confirmation', async ({ page }) => {
    const widget = new BookingWidgetPage(page, COMPANY_SLUG);
    const client = randomClientName('Happy');

    await test.step('Pick a service and the first available slot', async () => {
      const { chosenTime } = await widget.pickServiceAndFirstSlot(SERVICES.haircut);
      expect(chosenTime).toMatch(/^\d{2}:\d{2}$/);
    });

    await test.step('Review the summary and continue to contact details', async () => {
      await expect(page.getByText(SERVICES.haircut)).toBeVisible();
      await widget.goToContactStep();
    });

    await test.step('Fill contact details and submit', async () => {
      await widget.fillContactDetails({
        firstName: client.firstName,
        lastName: client.lastName,
        phone: randomValidPhone(),
      });
      await expect(widget.submitBookingButton).toBeEnabled();
      await widget.submitBooking();
    });

    await test.step('See the confirmation screen', async () => {
      await expect(widget.successHeading).toBeVisible();
      await expect(page.getByText(SERVICES.haircut)).toBeVisible();
    });
  });
});
