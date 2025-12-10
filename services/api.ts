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
  const fullUrl = `${API_BASE_URL}${endpoint}`
  console.log('🌐 [API] Request:', {
    method: options?.method || 'GET',
    url: fullUrl,
    endpoint,
    apiBaseUrl: API_BASE_URL
  })
  
  try {
    // הוספת token ל-headers אם קיים
    // נשתמש ב-JWT token (auth_token) אם קיים, אחרת ב-Firebase token
    const token = typeof window !== 'undefined' 
      ? (localStorage.getItem('auth_token') || localStorage.getItem('firebase_token'))
      : null
    
    console.log('🔑 [API] Token status:', {
      hasToken: !!token,
      tokenType: token ? (localStorage.getItem('auth_token') ? 'JWT' : 'Firebase') : 'none',
      tokenPreview: token ? token.substring(0, 20) + '...' : null
    })
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    console.log('📤 [API] Sending request with headers:', {
      hasAuth: !!headers['Authorization'],
      contentType: headers['Content-Type']
    })
    
    const response = await fetch(fullUrl, {
      headers,
      ...options,
    })
    
    console.log('📥 [API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    })

    if (!response.ok) {
      console.error('❌ [API] Request failed:', {
        status: response.status,
        statusText: response.statusText
      })
      
      // אם 401 - המשתמש לא מחובר
      if (response.status === 401) {
        console.warn('⚠️ [API] Unauthorized - clearing tokens')
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('firebase_token')
          localStorage.removeItem('user')
          // רק אם לא אנחנו כבר בדף login
          if (!window.location.pathname.includes('/login')) {
            console.log('🔄 [API] Redirecting to login...')
            window.location.href = '/login'
          }
        }
      }
      
      // נסה לקבל הודעת שגיאה מהשרת
      let errorMessage = `שגיאת HTTP: ${response.status}`
      try {
        const errorData = await response.json()
        console.error('❌ [API] Error details:', errorData)
        if (errorData.detail) {
          errorMessage = errorData.detail
        }
      } catch (e) {
        console.error('❌ [API] Could not parse error response:', e)
        // אם לא ניתן לקרוא JSON, נשתמש בהודעת ברירת מחדל
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log('✅ [API] Request successful:', {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : []
    })
    return { success: true, data }
  } catch (error) {
    console.error('❌ [API] Request error:', error)
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

