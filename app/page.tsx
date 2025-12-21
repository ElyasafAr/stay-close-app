'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loading } from '@/components/Loading'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to messages page as the new main screen
    router.replace('/messages')
  }, [router])

  return <Loading />
}

