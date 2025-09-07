// src/components/Syllabus.jsx
import React, { useEffect, useState } from 'react'
import { auth, db } from '../firebase'
import { ref, onValue, set, update } from 'firebase/database'
import Timer from './Timer'

function flattenProgress(obj, base = '', out = {}) {
  if (typeof obj !== 'object' || obj === null) return out
  Object.entries(obj).forEach(([key, val]) => {
    const path = base ? `${base}/${key}` : key
    if (typeof val === 'boolean') out[path] = val
    else if (typeof val === 'object' && 'done' in val) out[path] = val.done
    else flattenProgress(val, path, out)
  })
  return out
}

export default function Syllabus() {
  const uid = auth.currentUser.uid

  const [syllabus, setSyllabus] = useState({ Gate_Syallbus: {}, DSA_Syallbus: {} })
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(null)
  const [rawProgress, setRawProgress] = useState({})
  const [progMap, setProgMap] = useState({})
  const [editing, setEditing] = useState({})

  useEffect(() => {
    const gateRef = ref(db, 'Gate_Syallbus')
    const dsaRef = ref(db, 'DSA_Syallbus')

    const unsubGate = onValue(gateRef, snap => {
      setSyllabus(prev => ({ ...prev, Gate_Syallbus: snap.val() || {} }))
      setLoading(false)
    })

    const unsubDsa = onValue(dsaRef, snap => {
      setSyllabus(prev => ({ ...prev, DSA_Syallbus: snap.val() || {} }))
      setLoading(false)
    })

    return () => {
      unsubGate()
      unsubDsa()
    }
  }, [])

  useEffect(() => {
    const userRef = ref(db, `users/${uid}`)
    const unsub = onValue(userRef, snap => {
      const u = snap.val() || {}
      setStartDate(u.start_date || null)
      setRawProgress(u.progress || {})
    })
    return () => unsub()
  }, [uid])

  useEffect(() => {
    setProgMap(flattenProgress(rawProgress))
  }, [rawProgress])

  // ✅ no untick: only set to true if it was false
  const handleCheckbox = (sectionPath, idx) => {
    const key = `${sectionPath}/${idx}`
    if (progMap[key]) return // already true, do nothing
    set(ref(db, `users/${uid}/progress/${sectionPath}/${idx}`), {
      done: true,
      timestamp: Date.now(),
    })
    setProgMap(prev => ({
      ...prev,
      [key]: true
    }))
  }

  const handleSaveYT = (sectionPath, idx, newYT) => {
    const topicPath = `${sectionPath}/topics/${idx}`
    update(ref(db, topicPath), { yt: newYT }).then(() => {
      const key = `${sectionPath}/${idx}`
      setEditing(prev => ({
        ...prev,
        [key]: { active: false, value: '' }
      }))
    })
  }
  
  const renderTopics = (topics, sectionPath) =>
    topics.map((t, i) => {
      const key = `${sectionPath}/${i}`
      const editState = editing[key] || { active: false, value: t.yt }

      return (
        <li
          key={key}
          className="flex items-center bg-gray-800 hover:bg-gray-700 rounded-md p-2 mb-2 transition"
        >
          <span
            onClick={() => handleCheckbox(sectionPath, i)}
            className={`cursor-pointer text-2xl select-none ${progMap[key] ? 'text-green-400' : 'text-gray-400'}`}
          >
            {progMap[key] ? "✅" : "⭕"}
          </span>

          {!editState.active ? (
            <>
              <a
                href={t.yt}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 ml-4 truncate text-sm font-medium text-white hover:underline"
              >
                {t.title}
              </a>
              <button
                onClick={() =>
                  setEditing(prev => ({
                    ...prev,
                    [key]: { active: true, value: t.yt }
                  }))
                }
                className="ml-4 px-2 py-1 text-xs font-semibold text-pink-400 hover:text-pink-200 transition"
              >
                Edit YT
              </button>
            </>
          ) : (
            <div className="flex items-center ml-4 space-x-2">
              <input
                type="text"
                value={editState.value}
                onChange={e =>
                  setEditing(prev => ({
                    ...prev,
                    [key]: { active: true, value: e.target.value }
                  }))
                }
                className="flex-1 p-1 bg-gray-700 rounded text-sm text-white"
              />
              <button
                onClick={() => handleSaveYT(sectionPath, i, editState.value)}
                className="px-2 py-1 text-xs font-semibold text-green-400 hover:text-green-200 transition"
              >
                Save
              </button>
              <button
                onClick={() =>
                  setEditing(prev => ({
                    ...prev,
                    [key]: { active: false, value: '' }
                  }))
                }
                className="px-2 py-1 text-xs font-semibold text-gray-400 hover:text-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </li>
      )
    })

  const renderSections = (sectionObj, path = '') =>
    Object.entries(sectionObj || {}).map(([section, val]) => {
      const sectionPath = path + section

      if (Array.isArray(val?.topics)) {
        return (
          <div key={sectionPath} className="mb-4">
            <h3 className="text-pink-400 font-semibold text-lg">{section}</h3>
            <ul>{renderTopics(val.topics, sectionPath)}</ul>
          </div>
        )
      }

      if (typeof val === 'object') {
        return (
          <div key={sectionPath} className="mb-6">
            <h2 className="text-purple-300 text-xl font-bold mt-4">{section}</h2>
            <div className="ml-4">{renderSections(val, `${sectionPath}/`)}</div>
          </div>
        )
      }

      return null
    })

  if (loading) return <div className="p-6 text-white">Loading syllabus…</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6 font-poppins text-white">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📘 GATE & DSA Planner</h1>
        <Timer start_date={startDate} />
      </header>

      <section className="mb-10">
        <h1 className="text-3xl font-bold mb-6">📘 GATE Syllabus</h1>
        {renderSections(syllabus.Gate_Syallbus, "Gate_Syallbus/")}
      </section>

      <section>
        <h1 className="text-3xl font-bold mb-6">💻 DSA Syllabus</h1>
        {renderSections(syllabus.DSA_Syallbus, "DSA_Syallbus/")}
      </section>
    </div>
  )
}
