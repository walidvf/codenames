# Online lobby setup

The game now supports 20 shared online lobbies through Firebase Realtime Database.

## 1. Create Firebase Realtime Database

Create a Firebase project, add a Web app, then create a Realtime Database.

For quick testing only, use rules like this:

```json
{
  "rules": {
    "arabic-codenames": {
      ".read": true,
      ".write": true
    }
  }
}
```

These rules make the game public. For a serious public site, add authentication or stricter rules.

## 2. Paste the Firebase config

Open `firebase-config.js` and replace the empty values:

```js
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};
```

Once these values are filled, online sync turns on automatically.

## 3. Publish

Push the files to GitHub and use GitHub Pages with GitHub Actions. The workflow is already in `.github/workflows/pages.yml`.

Online lobby links look like:

```text
https://your-site.github.io/your-repo/#lobby-7
```
