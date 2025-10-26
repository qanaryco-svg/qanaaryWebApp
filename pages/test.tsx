import { useEffect, useState } from 'react'

export default function TestPage() {
  const [message, setMessage] = useState('Loading...')
  
  useEffect(() => {
    setMessage('Test page loaded successfully!')
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Next.js Test Page</h1>
      <p>{message}</p>
    </div>
  )
}