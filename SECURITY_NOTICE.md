# Security Notice

A Gemini API key was pasted into a chat during project planning.

Treat that key as compromised.

Required action:

1. Revoke or delete the exposed key in Google AI Studio or the relevant Google Cloud project.
2. Create a new key.
3. Store the new key only in `.env.local` and deployment secret storage.
4. Never paste the new key into Claude Code prompts, issue trackers, screenshots, or source files.
5. Confirm `.env.local` is ignored by Git.
6. If the key was ever committed, remove it from Git history and rotate it again.

The files in this starter package do not contain the exposed key.
