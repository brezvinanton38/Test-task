import { NatodiApiClient, BranchResponse, EmployeeWithSlotsResponse } from '../api/NatodiApiClient';

export interface NextSlot {
  branch: BranchResponse['data'];
  service: BranchResponse['data']['services'][number];
  employee: EmployeeWithSlotsResponse['data'][number];
  /** Soonest-first, currently bookable. */
  nearestSlotsIso: string[];
}

/** Asks the API for a real bookable slot instead of computing one by hand (see STRATEGY.md). */
export async function resolveNextSlot(
  api: NatodiApiClient,
  companySlug: string,
  serviceName: string,
): Promise<NextSlot> {
  const branch = (await (await api.getBranchBySlug(companySlug)).json()) as BranchResponse;
  const service = branch.data.services.find((s) => s.title === serviceName);
  if (!service) {
    throw new Error(`Service "${serviceName}" not found for company "${companySlug}"`);
  }

  const employeesWithSlots = (await (
    await api.listEmployeesWithNearestSlots({
      companyId: branch.data.company.id,
      branchId: branch.data.id,
      serviceId: service.id,
    })
  ).json()) as EmployeeWithSlotsResponse;
  const employee = employeesWithSlots.data[0];

  return { branch: branch.data, service, employee, nearestSlotsIso: employee.nearest_slots };
}
