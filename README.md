# Kangaroo Math Test App

Online Kangaroo-style multiple-choice test app built as a static site using plain HTML/CSS/JS and Firebase (Auth + Firestore).

## Features

- **Admin**
  - Email/password login.
  - Create questions with options A–E, correct answer, points, topic, difficulty, explanation.
  - Group questions into tests with optional time limits.
  - Activate/deactivate tests.
  - View test attempts and basic stats.

- **Students**
  - Register and log in with email/password.
  - See available active tests.
  - Take tests with single-page interface and timer.
  - View score and detailed per-question review after submission.

## Firebase setup

1. Go to the Firebase Console and create a new project.
2. In **Build → Authentication**, enable **Email/Password** sign-in.
3. In **Build → Firestore Database**, create a Firestore database in production or test mode.
4. In **Project settings → General → Your apps**, create a **Web app** and copy the Firebase config.
5. Open `app.js` and replace the placeholder `firebaseConfig` object with your config:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ...
};
```

6. Set your admin email(s) in the `ADMIN_EMAILS` array near the top of `app.js`.

## Running locally

Because this is a static app, you can:

- Open `index.html` directly in a browser, or
- Use any simple static server such as VS Code / Cursor **Live Server**.

You must be online so the Firebase CDN scripts can load and connect.

## Deploying code to GitHub

From `c:\Alok\AI\Cursor\MyHome` in PowerShell (after installing Git and setting your name/email):

```bash
git init
git add .
git commit -m "Initial Kangaroo math app"
git branch -M main
```

Then on GitHub:

1. Create a new empty repository (no README, no .gitignore).
2. Follow the instructions GitHub shows, for example:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## Deploying to Firebase Hosting (on Google Cloud)

1. Install **Node.js** from the official website (it includes `npm`).
2. Install the Firebase CLI globally:

```bash
npm install -g firebase-tools
```

3. Log in to Firebase:

```bash
firebase login
```

4. In the project folder (`c:\Alok\AI\Cursor\MyHome`), initialize hosting:

```bash
firebase init hosting
```

When prompted:

- Choose your Firebase project.
- Set the **public directory** to `.` (a single dot).
- Choose **Yes** for single-page app / rewrite all URLs to `index.html`.
- Do **not** overwrite `index.html` when asked.

5. Deploy:

```bash
firebase deploy --only hosting
```

The CLI will print a `https://<your-app>.web.app` (and possibly `firebaseapp.com`) URL you can share.

