// src/components/Timer.jsx
import React, { useState, useEffect } from 'react'
import { auth, db, ref, update } from '../firebase'

export default function Timer({ start_date }) {
  const uid = auth.currentUser.uid

  // State for the popup form
  const [isOpen, setIsOpen]     = useState(false)
  const [newStart, setNewStart] = useState(start_date || '')
  const [newEnd, setNewEnd]     = useState('')

  // State for countdown
  const [daysLeft, setDaysLeft] = useState(0)
  const [endDate, setEndDate]   = useState(null)

  // Compute default endDate (start + 90 days) and recalc daysLeft
  useEffect(() => {
    const start = newStart ? new Date(newStart) : new Date()
    const end   = new Date(start)
    end.setDate(end.getDate() + 90)
    setEndDate(end)
    setNewEnd(end.toISOString().split('T')[0])

    // helper to update daysLeft
    const updateDays = () => {
      const now   = new Date()
      const diff  = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
      setDaysLeft(diff > 0 ? diff : 0)
    }

    updateDays()
    const iv = setInterval(updateDays, 1000 * 60 * 60) // hourly refresh
    return () => clearInterval(iv)
  }, [newStart])

  // Save both dates back to the user record
  const saveDates = () => {
    if (!newStart || !newEnd) return
    update(ref(db, `users/${uid}`), {
      start_date: newStart,
      end_date:   newEnd,
    })
    setIsOpen(false)
  }

  // Format for display
  const fmt = d =>
    d.toLocaleDateString('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric',
    })

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1 bg-pink-500 rounded text-sm hover:bg-pink-600 transition"
        title="Click to change dates"
      >
        {daysLeft}d to go (ends {endDate ? fmt(endDate) : '—'})
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 p-4 bg-gray-800 rounded shadow-lg z-10">
          <h3 className="text-white font-semibold mb-2">Adjust Dates</h3>

          <label className="block text-sm text-gray-300">Start Date</label>
          <input
            type="date"
            value={newStart}
            onChange={e => setNewStart(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded mb-3 text-white"
          />

          <label className="block text-sm text-gray-300">End Date</label>
          <input
            type="date"
            value={newEnd}
            onChange={e => setNewEnd(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded mb-3 text-white"
          />

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={saveDates}
              className="px-3 py-1 bg-pink-500 rounded hover:bg-pink-600 text-sm"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
