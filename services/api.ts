/**
 * שירות API לתקשורת עם השרת
 * כל הפונקציות כאן מטפלות בתקשורת עם ה-backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * פונקציה כללית לביצוע קריאות API
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    // הוספת token ל-headers אם קיים
    // נשתמש ב-JWT token (auth_token) אם קיים, אחרת ב-Firebase token
    const token = typeof window !== 'undefined' 
      ? (localStorage.getItem('auth_token') || localStorage.getItem('firebase_token'))
      : null
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      ...options,
    })

    if (!response.ok) {
      // אם 401 - המשתמש לא מחובר
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          // רק אם לא אנחנו כבר בדף login
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
        }
      }
      
      // נסה לקבל הודעת שגיאה מהשרת
      let errorMessage = `שגיאת HTTP: ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          errorMessage = errorData.detail
        }
      } catch {
        // אם לא ניתן לקרוא JSON, נשתמש בהודעת ברירת מחדל
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה',
    }
  }
}

/**
 * קבלת נתונים מהשרת
 */
export async function getData<T>(endpoint: string): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { method: 'GET' })
}

/**
 * שליחת נתונים לשרת
 */
export async function postData<T>(
  endpoint: string,
  body: any
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/**
 * עדכון נתונים בשרת
 */
export async function putData<T>(
  endpoint: string,
  body: any
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/**
 * מחיקת נתונים מהשרת
 */
export async function deleteData<T>(
  endpoint: string
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { method: 'DELETE' })
}

