import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { AppUser, UserRole } from '@/types';
import { encryptNationalId } from '@/utils/idCrypto';

export function subscribeToAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: UserRole,
  nationalId: string
): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const appUser: AppUser = {
    uid: cred.user.uid,
    email,
    firstName,
    lastName,
    role,
    nationalId: encryptNationalId(nationalId), // ciphertext only, from here on
    createdAt: Date.now(),
  };
  await setDoc(doc(db, 'users', cred.user.uid), appUser);
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

export async function getAppUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as AppUser) : null;
}

export async function updateAppUser(
  uid: string,
  patch: Partial<AppUser>
): Promise<void> {
  await setDoc(doc(db, 'users', uid), patch, { merge: true });
}
