import { postData } from './api';

export interface SupportTicket {
  subject: string;
  message: string;
  email?: string;
}

/**
 * Send a support ticket (Contact Us message)
 */
export async function sendSupportTicket(ticket: SupportTicket): Promise<{ success: boolean; ticket_id: number }> {
  const response = await postData<any>('/api/support/ticket', ticket);
  
  if (response.success && response.data) {
    return { success: true, ticket_id: response.data.ticket_id };
  }
  
  return { success: false, ticket_id: 0 };
}
