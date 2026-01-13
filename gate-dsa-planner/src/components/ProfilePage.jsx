import React, { useState, useEffect } from 'react'
import { getAuth } from 'firebase/auth'
import { getDatabase, ref, onValue, update } from 'firebase/database'

export default function ProfilePage({ syllabus }) {
  const auth = getAuth()
  const uid = auth.currentUser.uid
  const userRef = ref(getDatabase(), `users/${uid}`)

  const [profile, set_profile] = useState(null)
  const [edit, set_edit] = useState({
    start_date: '',
    section: '',
    index: 0,
    yt_link: '',
  })



  

  useEffect(() => {
    const unsub = onValue(userRef, snap => {
      set_profile(snap.val())
    })
    return () => unsub()
  }, [])

  // don’t render until we’ve loaded
  if (!profile) return <div className="p-6 text-white">Loading profile…</div>

  const save_start_date = () =>
    update(userRef, { start_date: edit.start_date || profile.start_date })

  const save_yt = () => {
    if (!edit.section || edit.index == null) {
      return alert('Please fill section and index first')
    }
    const path = `syllabus/${edit.section}/topics/${edit.index}/yt`
    return update(ref(getDatabase(), path), { yt: edit.yt_link })
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6 text-white">
      <div className="bg-gray-800 p-4 rounded">
        <h2 className="font-semibold mb-2">Edit Start Date</h2>
        <input
          type="date"
          defaultValue={profile.start_date}
          onChange={e => {
            const v = e?.target?.value
            if (v) set_edit(prev => ({ ...prev, start_date: v }))
          }}
          className="w-full p-2 bg-gray-700 rounded"
        />
        <button
          onClick={save_start_date}
          className="mt-2 px-4 py-2 bg-pink-500 rounded"
        >
          Save Date
        </button>
      </div>

      <div className="bg-gray-800 p-4 rounded">
        <h2 className="font-semibold mb-2">Fix YouTube Link</h2>
        <input
          placeholder="Section Key"
          defaultValue={edit.section}
          onChange={e => {
            const v = e?.target?.value
            if (v) set_edit(prev => ({ ...prev, section: v }))
          }}
          className="block w-full p-2 bg-gray-700 rounded mb-2"
        />
        <input
          type="number"
          placeholder="Topic Index"
          defaultValue={edit.index}
          onChange={e => {
            const v = e?.target?.value
            if (v != null) set_edit(prev => ({ ...prev, index: Number(v) }))
          }}
          className="block w-full p-2 bg-gray-700 rounded mb-2"
        />
        <input
          placeholder="New YouTube URL"
          defaultValue={edit.yt_link}
          onChange={e => {
            const v = e?.target?.value
            if (v) set_edit(prev => ({ ...prev, yt_link: v }))
          }}
          className="block w-full p-2 bg-gray-700 rounded mb-2"
        />
        <button
          onClick={save_yt}
          className="px-4 py-2 bg-indigo-500 rounded"
        >
          Update YT
        </button>
      </div>
    </div>
  )
}
