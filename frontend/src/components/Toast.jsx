import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`toast toast--${type}`}>
      <span className="toast-icon">{type === 'success' ? '✓' : '✕'}</span>
      {message}
    </div>
  )
}
