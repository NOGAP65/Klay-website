# A `git push` that produces no output and no error

**Symptom:** `git push` hangs. No progress, no error, no failure message. It eventually times
out or sits until you kill it. Meanwhile `git fetch`, `git ls-remote` and `git pull` all work
normally.

**It is not a network failure. It is a credential prompt you cannot see.**

---

## The signature

| What you see | What it means |
|---|---|
| `git ls-remote origin` **works** | The network and the remote are fine |
| `git push` hangs with **no output at all** | Git Credential Manager is waiting for input |
| No error, no timeout message, no `fatal:` | Nothing failed — something is *waiting* |

**An error would be good news.** A failure prints. A hang means a process is blocked on an
answer, and the only thing in a push that asks a question is authentication.

## Why it happens here

`credential.helper = manager` — Git Credential Manager, set in both the system and user
gitconfig. When it has no valid token it tries to obtain one interactively: a browser flow, a
device code, or a dialog.

In a non-interactive shell — a CI step, an agent session, anything without a console it can draw
on — there is nowhere to put that prompt, and `GIT_ASKPASS` may point at a helper whose round
trip never completes. GCM waits. Git waits on GCM. Nothing times out, because nothing has failed.

Reads keep working throughout, because a public fetch needs no credential. **That asymmetry is
the tell**, and it is what makes this look like a partial network problem when it is not.

## How to confirm it in one command

```bash
GIT_TRACE=1 GCM_TRACE=1 git push origin <branch>
```

Watch for where it stops.

- Stalls at `[GetProviderAsync]` or a `get`/`prompt` step → **credential acquisition.** This
  runbook.
- Reaches `run_command: git send-pack` and then `pack-objects` → authentication succeeded and
  you are watching an upload. That is slow, not hung; give it time, especially on a first push
  or a repo carrying large binaries.

A healthy trace ends with the ref update:

```
To https://github.com/<org>/<repo>
   543da6f..21360d8  <branch> -> <branch>
```

## The fix

**Run one push from a real interactive terminal.** Let GCM open its browser or print its device
code, and complete the sign-in. It writes the token to Windows Credential Manager and every
later push — including from non-interactive sessions — returns immediately.

Confirm a credential is stored:

```bash
printf "protocol=https\nhost=github.com\n\n" | git credential fill
```

It should return a `username=` and `password=` line **instantly**. If *that* hangs, you are
watching the same prompt with the same cause.

## What NOT to conclude

- **Not** that the remote is down — check with `git ls-remote` before believing it.
- **Not** that the branch or ref is wrong — a bad ref prints an error immediately.
- **Not** that it needs `--force` — force changes nothing about authentication, and reaching
  for it here risks discarding someone else's work for an unrelated reason.
- **Not** that retrying will help. It will hang identically. The state that needs changing is
  the credential store, and no number of retries changes it.

## Local history: how this was misdiagnosed once

An earlier note in this project recorded the cause as *"git auth rides a VS Code pipe; pushes
hang silently when VS Code is closed."* That was wrong, and the way it was wrong is instructive.

When the hang recurred, VS Code **was** running, its git IPC pipe
(`\\.\pipe\vscode-git-<id>-sock`) **was** open, and both `askpass.sh` and `askpass-main.js`
existed at the path `GIT_ASKPASS` pointed to. Every part of the previous explanation checked out,
and the push still hung.

The trace showed GCM acquiring and then storing a credential — *"Credential was successfully
stored"* — after which the push completed in under a second and has every time since.

**The VS Code askpass shim was a bystander.** It is the mechanism a prompt would travel through,
which made it a plausible culprit, and it had been recorded as the cause because it was the most
visible moving part at the time. **The actual variable was whether GCM had a token.**

The general lesson, which is the reason this file exists rather than a one-line note: *a
component that would be involved in a failure is not thereby the cause of it.* Check the thing
that changes between a working run and a hanging one — here, the credential store — rather than
the most complicated thing in the path.
