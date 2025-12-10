/**
 * שירות ליצירת הודעות עם AI
 */

import { postData } from './api'

export interface MessageRequest {
  contact_id: number
  message_type: 'birthday' | 'holiday' | 'checkin' | 'custom'
  tone: 'friendly' | 'formal' | 'casual' | 'warm'
  additional_context?: string
  language?: string
}

export interface GeneratedMessage {
  success: boolean
  message: string
  contact_name: string
  message_type: string
  tone: string
}

/**
 * יצירת הודעה מעוצבת עם AI
 */
export async function generateMessage(request: MessageRequest): Promise<GeneratedMessage> {
  const response = await postData<GeneratedMessage>('/api/messages/generate', request)
  if (response.success && response.data) {
    return response.data
  }
  throw new Error(response.error || 'שגיאה ביצירת הודעה')
}

