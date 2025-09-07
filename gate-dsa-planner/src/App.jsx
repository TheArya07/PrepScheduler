// src/App.jsx
import React, { useEffect, useState } from 'react'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { getDatabase, ref, onValue } from 'firebase/database'
import AuthPage from './components/AuthPage'
import Syllabus from './components/Syllabus'
import ProgressTracker from './components/ProgressTracker'

export default function App() {
  const [user, set_user] = useState(null)
  const [profile, set_profile] = useState({})
  const [syllabus, set_syllabus] = useState({})

  const auth = getAuth()
  
  const db   = getDatabase()

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      if (u) {
        set_user(u)
        const user_ref = ref(db, `users/${u.uid}`)
        onValue(user_ref, snap => set_profile(snap.val() || {}))
        const root_ref = ref(db)
        onValue(root_ref, snap => {
          const data = snap.val() || {}
          set_syllabus({
            Gate_Syallbus: data.Gate_Syallbus || {},
            DSA_Syallbus: data.DSA_Syallbus || {}
          })
        })
      } else {
        set_user(null)
        set_profile({})
        set_syllabus({})
      }
    })
  }, [])

  if (!user) return <AuthPage />

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="flex justify-between items-center p-4 bg-gray-800">

        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Hi, {profile.name}.</h1>
         </div> 
               <button
          onClick={() => signOut(auth)}
          className="px-3 py-1 bg-red-500 rounded text-sm hover:bg-red-600 transition"
        >
          Sign Out
        </button>
      </header>

      <main className="p-6">
        <Syllabus />
        <ProgressTracker />
      </main>
    </div>
  )
}
