/**
 * API service for communication with the server
 * All functions here handle communication with the backend
 */

// Read the environment variable with debug logs
const envApiUrl = process.env.NEXT_PUBLIC_API_URL
const API_BASE_URL = envApiUrl || 'http://localhost:8000'

// Debug log - only on client side
if (typeof window !== 'undefined') {
  console.log('🔍 [API] Environment check:', {
    'process.env.NEXT_PUBLIC_API_URL': envApiUrl,
    'API_BASE_URL (final)': API_BASE_URL,
    'isLocalhost': API_BASE_URL.includes('localhost'),
    'isRailway': API_BASE_URL.includes('railway.app')
  })
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * General function for making API calls
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
    // Add token to headers if available
    // Use JWT token (auth_token) if available, otherwise Firebase token
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
      
      // If 401 - user is not authenticated
      if (response.status === 401) {
        console.warn('⚠️ [API] Unauthorized - clearing tokens')
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('firebase_token')
          localStorage.removeItem('user')
          // Only redirect if we're not already on the login page
          if (!window.location.pathname.includes('/login')) {
            console.log('🔄 [API] Redirecting to login...')
            window.location.href = '/login'
          }
        }
      }
      
      // Try to get error message from server
      let errorMessage = `HTTP Error: ${response.status}`
      try {
        const errorData = await response.json()
        console.error('❌ [API] Error details:', errorData)
        if (errorData.detail) {
          errorMessage = errorData.detail
        }
      } catch (e) {
        console.error('❌ [API] Could not parse error response:', e)
        // If we can't read JSON, use default message
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
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get data from server
 */
export async function getData<T>(endpoint: string): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { method: 'GET' })
}

/**
 * Send data to server
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
 * Update data on server
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
 * Delete data from server
 */
export async function deleteData<T>(
  endpoint: string
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { method: 'DELETE' })
}

