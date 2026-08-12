import { useEffect, useState } from 'react'

export default function NoNetwork({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    setOnline(navigator.onLine)

    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (!online) {
    return (
      <div className='min-h-screen flex flex-col justify-center mx-auto text-center item-center max-w-7xl' style={{ textAlign: 'center', padding: 50 }}>
        <h1 className='arial'>No Internet Connection</h1>
      </div>
    )
  }

  return children
}
