/**
 * Firebase is optional: without these env vars the app runs in "this device only" mode
 * (browser storage), exactly like the prototype. The values are public identifiers, not
 * secrets — access is protected by Firestore security rules (see firestore.rules).
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

type Firebase = {
  auth: import("firebase/auth").Auth;
  db: import("firebase/firestore").Firestore;
};

let instance: Promise<Firebase> | null = null;

/** Loads the Firebase SDK on demand (client only) so the first page load stays light. */
export function getFirebase(): Promise<Firebase> {
  if (!isFirebaseConfigured) return Promise.reject(new Error("Firebase is not configured"));
  if (instance) return instance;
  instance = (async () => {
    const [{ initializeApp, getApps }, { getAuth, browserLocalPersistence, setPersistence }, fs] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/firestore"),
    ]);
    const app = getApps()[0] ?? initializeApp(config as Required<typeof config>);
    const auth = getAuth(app);
    await setPersistence(auth, browserLocalPersistence);
    let db: import("firebase/firestore").Firestore;
    try {
      // Offline cache shared across tabs: the app keeps working without a connection.
      db = fs.initializeFirestore(app, {
        ignoreUndefinedProperties: true,
        localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
      });
    } catch {
      db = fs.getFirestore(app); // already initialised (hot reload)
    }
    return { auth, db };
  })();
  instance.catch(() => (instance = null));
  return instance;
}
