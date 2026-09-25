import { expect, Locator, Page } from '@playwright/test';

export interface ContactDetails {
  firstName: string;
  lastName?: string;
  phone: string;
}

/** Page object for the public Natodi booking widget (book.natodi.com/{slug}). */
export class BookingWidgetPage {
  constructor(private readonly page: Page, private readonly slug: string) {}

  async open(): Promise<void> {
    await this.page.goto(`/${this.slug}`);
    await expect(this.page.getByText('Оберіть послуги')).toBeVisible();
  }

  async openServiceStep(): Promise<void> {
    await this.page.getByText('Оберіть послуги').click();
    await expect(this.page).toHaveURL(/\/services/);
  }

  async addService(serviceName: string): Promise<void> {
    // The add button has no accessible name, so scope by the card's component tag instead.
    const card = this.page.locator('app-short-info-card').filter({ hasText: serviceName });
    await card.getByRole('button').click();
  }

  async goToEmployeeStep(): Promise<void> {
    await this.page.getByText('Виконавець', { exact: true }).click();
    await expect(this.page).toHaveURL(/\/employee/);
  }

  /** Available time slot buttons look like "09:00", "10:00", etc. */
  timeSlotButtons(): Locator {
    return this.page.getByRole('button', { name: /^\d{2}:\d{2}$/ });
  }

  async selectFirstAvailableSlot(): Promise<string> {
    const slots = this.timeSlotButtons();
    await expect(slots.first()).toBeVisible();
    const time = (await slots.first().textContent())?.trim() ?? '';
    await slots.first().click();
    return time;
  }

  async isSlotAvailable(time: string): Promise<boolean> {
    return (await this.page.getByRole('button', { name: time, exact: true }).count()) > 0;
  }

  /** "Продовжити" is a real <button> on some steps but plain text on others (see STRATEGY.md). */
  private async clickContinue(): Promise<void> {
    const button = this.page.getByRole('button', { name: 'Продовжити', exact: true });
    const control = (await button.count()) > 0 ? button : this.page.getByText('Продовжити', { exact: true });
    await control.click();
  }

  /** Leaves the employee/slot step and lands on the booking summary. */
  async confirmSlotSelection(): Promise<void> {
    await this.clickContinue();
    await expect(this.page).toHaveURL(new RegExp(`/${this.slug}(\\?|$)`));
  }

  /** From the booking summary, proceeds to the contact-details step. */
  async goToContactStep(): Promise<void> {
    await this.clickContinue();
    await expect(this.page).toHaveURL(/\/confirmation/);
  }

  async fillContactDetails(details: ContactDetails): Promise<void> {
    await this.page.getByRole('textbox', { name: "Ім'я *" }).fill(details.firstName);
    if (details.lastName) {
      await this.page.getByRole('textbox', { name: 'Прізвище' }).fill(details.lastName);
    }
    await this.page.getByRole('textbox', { name: 'Телефон *' }).pressSequentially(details.phone);
  }

  get submitBookingButton(): Locator {
    return this.page.getByRole('button', { name: 'Записатись' });
  }

  async submitBooking(): Promise<void> {
    await this.submitBookingButton.click();
    await expect(this.page).toHaveURL(/\/success\//);
  }

  get successHeading(): Locator {
    return this.page.getByText('Ви успішно записалися!');
  }

  /** Shared setup for the happy-path and phone-validation tests: pick a service and the first open slot. */
  async pickServiceAndFirstSlot(serviceName: string): Promise<{ chosenTime: string }> {
    await this.open();
    await this.openServiceStep();
    await this.addService(serviceName);
    await this.goToEmployeeStep();
    const chosenTime = await this.selectFirstAvailableSlot();
    await this.confirmSlotSelection();
    return { chosenTime };
  }
}
