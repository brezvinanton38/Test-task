import { APIRequestContext } from '@playwright/test';
import { z } from 'zod';

/** Schema for GET /services/ — used to assert the response shape, not just individual values. */
export const serviceListResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      price: z.number(),
      price_type: z.string(),
      duration: z.number(),
      active: z.boolean(),
    }),
  ),
  pagination: z.object({ limit: z.number(), offset: z.number(), total: z.number() }),
});

export interface BranchResponse {
  data: {
    id: string;
    slug: string;
    title: string;
    company: { id: string };
    is_active: boolean;
    employees: Array<{ id: string; first_name: string; last_name: string }>;
    services: Array<{ id: string; title: string; price: number; duration: number }>;
  };
}

export interface ServiceListResponse {
  data: Array<{ id: string; title: string; price: number; duration: number }>;
}

export interface EmployeeWithSlotsResponse {
  data: Array<{ id: string; first_name: string; last_name: string; nearest_slots: string[] }>;
}

export interface CreateClientPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  instagram: string;
  telegram: string;
  company_id: string;
}

export interface ValidateAppointmentPayload {
  branch_id: string;
  company_id: string;
  employee_id: string;
  start_at: string;
  services: Array<{ service_id: string; quantity: number }>;
  price: number;
  duration: number;
  client_note: null;
}

export interface CreateAppointmentPayload extends ValidateAppointmentPayload {
  client_id: string;
}

/** Thin wrapper over the public Natodi widget API used by tests/api specs. */
export class NatodiApiClient {
  constructor(private readonly request: APIRequestContext) {}

  getBranchBySlug(slug: string) {
    return this.request.get(`branches/${slug}/slug`);
  }

  listServices(params: { companyId: string; branchId: string }) {
    return this.request.get('services/', {
      params: {
        company_id: params.companyId,
        branch_id: params.branchId,
        active: 'true',
        available_from_widget: 'true',
      },
    });
  }

  listEmployeesWithNearestSlots(params: { companyId: string; branchId: string; serviceId: string }) {
    return this.request.get('employees/', {
      params: {
        company_id: params.companyId,
        branch_id: params.branchId,
        service_ids: params.serviceId,
        bookable: 'true',
        include_nearest_slots: 'true',
        nearest_slots_limit: '4',
        limit: '15',
        offset: '0',
      },
    });
  }

  validateAppointment(payload: ValidateAppointmentPayload) {
    return this.request.post('appointments/validate', { data: payload });
  }

  createClient(payload: CreateClientPayload) {
    return this.request.post('clients/', { data: payload });
  }

  createAppointment(payload: CreateAppointmentPayload) {
    return this.request.post('appointments/', { data: payload });
  }
}
