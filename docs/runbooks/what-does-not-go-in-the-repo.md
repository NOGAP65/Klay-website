# WHAT DOES NOT GO IN THE REPOSITORY

> ## Supplier documents live outside the repository.
>
> **Catalogues, pitch decks, price lists, spec sheets, trade terms.** Legitimate reference material
> that the business genuinely uses — and that still does not belong in git.

## The reason

**Supplier pricing in a git repository is a commercial exposure the moment the repository is
shared.** Not when it is published, not when it is deployed — when it is *shared*. A contractor
cloning the repo to fix a button gets the trade terms with it, and nothing about that clone looks
unusual to anyone.

**And git makes it worse than an ordinary misplaced file, because deleting it does not remove it.**
Every version of every committed file stays in the history. A file added on Monday and deleted on
Tuesday is still in the clone somebody takes on Wednesday. **The remedy after the fact is rewriting
history, which means force-pushing over everyone's work** — expensive, disruptive, and easy to do
incompletely.

**So the only cheap moment is before the first commit.** That is the whole reason this is a
gitignore entry rather than a review habit.

## What is ignored

```
/*.pdf   /*.PDF   /*.xlsx   /*.docx   /*.pptx
```

**Repository root only, and deliberately broad.** The failure being prevented is not somebody
deciding to commit a price list — nobody does that on purpose. It is **a document landing in the
working directory and a wide `git add` taking it**, which has happened twice in this project:

| | What happened |
|---|---|
| A telco application form | Reached `public/` — the **web root** — carrying personal information, publicly downloadable |
| `settings.local.json` | Sat inside `public/images/` since July, protected only by a global ignore on one machine |

**Both were swept up rather than chosen.** The pattern is the same one that put four shim deletions
into a commit about a card photograph: `git add -A` is a claim over everything in the directory,
including whatever you forgot was there.

## Where they go instead

**The shared drive.** If a document needs to be near the code, link to it — a path or a URL in a
comment costs nothing and carries no history.

**`assets-source/` is not the answer either.** It is ignored, so it is safe from commits, but it is
for large image originals that production never serves. A supplier PDF in an ignored directory is
one `git add -f` or one edited `.gitignore` away from being tracked, and it is invisible to
everyone who does not have that working copy. Use the shared drive, where other people can find it.

## The general rule

> **If it came from outside the business and describes commercial terms, it does not go in the
> repository — regardless of how useful it is to have nearby.**

The test is not "is this sensitive?" — most people will answer no about a product catalogue. The
test is **"who gets this when the repo is shared, and would I hand it to them deliberately?"**
