import React, { useEffect, useState } from 'react'
import { db, auth } from '../firebase'
import { ref, onValue } from 'firebase/database'

export default function ProgressTracker() {
  const uid = auth.currentUser.uid

  const [totalTopics, setTotalTopics] = useState(0)
  const [completedTopics, setCompletedTopics] = useState(0)
  const [weeklyStats, setWeeklyStats] = useState({})
  const [nextGate, setNextGate] = useState(null)
  const [nextDsa, setNextDsa] = useState(null)

  useEffect(() => {
    const gateRef = ref(db, 'Gate_Syallbus')
    const dsaRef  = ref(db, 'DSA_Syallbus')
    const userRef = ref(db, `users/${uid}/progress`)

    let gateTopics = []
    let dsaTopics = []

    const flattenSyllabus = (obj, targetArray, path='') => {
      Object.entries(obj).forEach(([key, val]) => {
        if (Array.isArray(val?.topics)) {
          val.topics.forEach((topic, i) => {
            targetArray.push({
              path: `${path}${key}/${i}`,
              section: key,
              title: topic.title
            })
          })
        } else if (typeof val === 'object') {
          flattenSyllabus(val, targetArray, `${path}${key}/`)
        }
      })
    }

    const unsubGate = onValue(gateRef, snap => {
      flattenSyllabus(snap.val() || {}, gateTopics)
      setTotalTopics(gateTopics.length + dsaTopics.length)
    })
    const unsubDsa = onValue(dsaRef, snap => {
      flattenSyllabus(snap.val() || {}, dsaTopics)
      setTotalTopics(gateTopics.length + dsaTopics.length)
    })

    const flattenProgress = (obj, base = '', out = {}) => {
      if (typeof obj !== 'object' || obj === null) return out
      Object.entries(obj).forEach(([key, val]) => {
        const path = base ? `${base}/${key}` : key
        if (typeof val === 'boolean') out[path] = val
        else if (typeof val === 'object' && 'done' in val) out[path] = val.done
        else flattenProgress(val, path, out)
      })
      return out
    }

    const unsubUser = onValue(userRef, snap => {
      let done = 0
      let weekly = {}
      const progressMap = flattenProgress(snap.val() || {})

      const traverse = (obj) => {
        if (typeof obj !== 'object') return
        Object.values(obj).forEach(val => {
          if (val === true) done += 1
          else if (typeof val === 'object' && val.done) {
            done += 1
            const week = new Date(val.timestamp).toLocaleDateString('en-GB', { week: 'numeric', year: 'numeric' })
            weekly[week] = (weekly[week] || 0) + 1
          }
          else traverse(val)
        })
      }
      traverse(snap.val() || {})
      setCompletedTopics(done)
      setWeeklyStats(weekly)

      // find next topics from gate and dsa separately
      const nextG = gateTopics.find(t => !progressMap[t.path])
      const nextD = dsaTopics.find(t => !progressMap[t.path])
      setNextGate(nextG)
      setNextDsa(nextD)
    })

    return () => { unsubGate(); unsubDsa(); unsubUser() }
  }, [uid])

  const percent = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-6">
      <h2 className="text-xl font-bold mb-2 text-pink-400">Progress</h2>
      <div className="w-full bg-gray-600 h-4 rounded overflow-hidden mb-2">
        <div
          style={{ width: `${percent}%` }}
          className="bg-pink-500 h-full transition-all"
        />
      </div>
      <p className="text-sm text-gray-300 mb-2">
        {completedTopics} / {totalTopics} topics completed ({percent}%)
      </p>

      {nextGate || nextDsa ? (
        <div className="text-green-400 mt-3 space-y-1">
          {nextGate && (
            <p>👉 Next GATE: <span className="font-semibold">{nextGate.section} / {nextGate.title}</span></p>
          )}
          {nextDsa && (
            <p>👉 Next DSA: <span className="font-semibold">{nextDsa.section} / {nextDsa.title}</span></p>
          )}
        </div>
      ) : (
        <p className="text-green-400 mt-3">🎉 All topics completed!</p>
      )}

      <h3 className="text-pink-400 font-semibold mt-4 mb-1">Weekly Summary</h3>
      <ul className="text-sm text-gray-300 space-y-1">
        {Object.entries(weeklyStats).map(([week, count]) => (
          <li key={week}>Week {week}: ✅ {count} topics done</li>
        ))}
      </ul>
    </div>
  )
}
