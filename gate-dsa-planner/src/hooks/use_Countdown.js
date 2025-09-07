import { useState, useEffect } from 'react'

export default function use_countdown(start_date) {
  const [days_passed, set_days_passed] = useState(0)

  useEffect(() => {
    if (!start_date) return
    const start = new Date(start_date)
    const update = () =>
      set_days_passed(Math.min(90, Math.floor((Date.now() - start)/86400000)))
    update()
    const iv = setInterval(update, 3600000)
    return () => clearInterval(iv)
  }, [start_date])

  return days_passed
}
