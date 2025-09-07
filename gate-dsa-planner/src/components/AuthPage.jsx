import React from 'react'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { getDatabase, ref, set } from 'firebase/database'

export default function AuthPage() {
  const auth = getAuth()
  const db = getDatabase()
  const provider = new GoogleAuthProvider()

  const handle_google = async () => {
    try {
      const { user } = await signInWithPopup(auth, provider)
      const { displayName, email, photoURL, uid } = user
      const start_date = new Date().toISOString().split('T')[0]

      await set(ref(db, `users/${uid}`), {
        name: displayName,
        email,
        profile_photo: photoURL,
        start_date,
      })
    } catch (error) {
      console.error('Google sign-in failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Sign in to Your Account</h2>
        <button
          onClick={handle_google}
          className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition"
        >
          Continue with Google
        </button>
      </div>
    </div>
  )
}
