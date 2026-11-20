# Firebase setup (one time, about 10 minutes, free)

This turns on Google sign-in and syncs your ScholarMap data across devices.
Everything stays on Firebase's free **Spark** plan — no card needed.

## 1. Create the project
1. Go to <https://console.firebase.google.com> and sign in with your Google account.
2. **Create a project** → name it `scholarmap` → you can turn **off** Google Analytics → **Create**.

## 2. Turn on Google sign-in
1. Left menu: **Build → Authentication** → **Get started**.
2. **Sign-in method** tab → **Google** → **Enable** → choose your support email → **Save**.
3. **Settings** tab → **Authorized domains** → **Add domain** → `scholarmap-omega.vercel.app`.
   (`localhost` is already there.)

## 3. Create the database
1. Left menu: **Build → Firestore Database** → **Create database**.
2. Location: pick one near you (e.g. `asia-south1` / `europe-west`) — this can't be changed later.
3. Start in **production mode** → **Create**.
4. Open the **Rules** tab, replace everything with the contents of [`firestore.rules`](firestore.rules)
   → **Publish**.
   - Recommended: use the "optional extra lock" version at the bottom of that file with your
     own email typed in, so only your account can use the database.

## 4. Get the web config
1. Click the ⚙️ next to **Project Overview** → **Project settings**.
2. Under **Your apps**, click the **Web** icon (`</>`) → nickname `scholarmap-web` → **Register app**
   (no Hosting needed).
3. You'll see a `firebaseConfig` block. You need four values from it:
   `apiKey`, `authDomain`, `projectId`, `appId`.

## 5. Add the values to Vercel
1. Vercel → your **scholarmap** project → **Settings → Environment Variables**.
2. Add (for Production, Preview and Development):

   | Name | Value from firebaseConfig |
   | --- | --- |
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |

3. **Deployments** tab → the latest deployment → **⋯ → Redeploy**.

For local development, copy `.env.example` to `.env.local` and fill in the same values.

## 6. First sign-in
Open the site → **Continue with Google**. The first time, whatever is saved in that browser is
copied into your account. On other devices, signing in loads your account's data.

## Good to know
- Works offline; changes sync when you're back online.
- **Sign out** removes your data from that device (it stays in your account).
- Free-tier limits (1 GiB stored, 50k reads / 20k writes per day) are far beyond one person's use.
- These config values are **not secrets** — they identify the project. Your data is protected by
  the security rules from step 3.
