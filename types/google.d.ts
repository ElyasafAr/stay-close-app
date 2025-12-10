// Type definitions for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: (callback?: (notification: any) => void) => void
          renderButton: (element: HTMLElement, config: any) => void
        }
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string }) => void
          }) => {
            requestAccessToken: () => void
          }
        }
      }
    }
  }
}

export {}

