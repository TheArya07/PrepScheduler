import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, set, get, update, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCFnM3AYV7Cstqjaf-1Mfe_CWxMNwh9gQY",
  authDomain: "prep-scheduler.firebaseapp.com",
  projectId: "prep-scheduler",
  storageBucket: "prep-scheduler.appspot.com",
  messagingSenderId: "1064922408035",
  appId: "1:1064922408035:web:50f2d9bf0d1defcf648456",
  measurementId: "G-SPT53QMNQT"
};
const logout = () => signOut(auth);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  const userRef = ref(db, `users/${user.uid}`);
  const snap = await get(userRef);
  if (!snap.exists()) {
    await set(userRef, {
      name: user.displayName,
      email: user.email,
      photo: user.photoURL,
      profileCompleted: false,
      lastLogin: Date.now()
    });
  } else {
    await update(userRef, { lastLogin: Date.now() });
  }

  return user;
};

export {
  auth,
  db,
  ref,
  set,
  get,
  update,
  onValue,
  onAuthStateChanged,
  signInWithGoogle,
  logout
};
