import { useState, useCallback, useRef } from 'react'

export function useToast() {
  const [toast, setToast] = useState('')
  const timerRef = useRef(null)

  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setToast(''), 2000)
  }, [])

  return { toast, showToast }
}
