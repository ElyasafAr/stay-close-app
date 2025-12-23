import { fetchApi } from './api';

export interface SupportTicket {
  subject: string;
  message: string;
  email?: string;
}

/**
 * Send a support ticket (Contact Us message)
 */
export async function sendSupportTicket(ticket: SupportTicket): Promise<{ success: boolean; ticket_id: number }> {
  return await fetchApi('/api/support/ticket', {
    method: 'POST',
    body: JSON.stringify(ticket),
  });
}
