Steps to deploy this static site to Firebase Hosting

1) Create a Firebase project
   - Go to https://console.firebase.google.com and create a project (or use an existing one).
   - Note the project id (e.g. my-project-12345).

2) Create a service account for CI
   - In Google Cloud Console -> IAM & Admin -> Service Accounts create a new service account.
   - Grant it the role: "Firebase Hosting Admin" (or Project Editor for broader access).
   - Create a JSON key for that service account and download it.

3) Add the service account to GitHub Secrets
   - Open your GitHub repo -> Settings -> Secrets -> Actions -> New repository secret.
   - Name: FIREBASE_SERVICE_ACCOUNT
   - Value: the full JSON contents of the service account key file (paste entire JSON).

4) Update project id
   - Open `.firebaserc` and replace `YOUR_FIREBASE_PROJECT_ID` with your Firebase project id.
   - Alternatively, edit `.github/workflows/firebase-hosting-deploy.yml` and set `projectId` to your project id (recommended to keep in file).

5) Push to main
   - The workflow triggers on pushes to `main`. After pushing the branch, the GitHub Actions workflow will run and deploy the folder configured in `firebase.json`:

     site-copy/kjs-typing-simulator.onrender.com

6) Troubleshooting
   - If workflow fails with auth errors, ensure the secret is valid JSON and the service account has the required permissions.
   - To test locally, you can also use the Firebase CLI (`npm i -g firebase-tools`) and run `firebase deploy --only hosting` after `firebase login`.

Notes
- This repo already contains `firebase.json` which sets the public folder used for hosting.
- Do NOT commit your service account JSON to the repo — always store it in GitHub Secrets.
