/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore (with the critical custom database ID parameter from config)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Storage
export const storage = getStorage(app);

// Initialize Authentication and Providers
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Export login helpers
export { signInWithPopup, signOut };
