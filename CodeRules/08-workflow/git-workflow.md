# Git Workflow

Version control guidelines for VerifyWise development.

## Branching Strategy

### Branch Types

| Type | Pattern | Purpose | Lifetime |
|------|---------|---------|----------|
| `main` | `main` | Production-ready code | Permanent |
| `develop` | `develop` | Integration branch | Permanent |
| `feature` | `feature/description` | New features | Temporary |
| `bugfix` | `bugfix/description` | Bug fixes | Temporary |
| `hotfix` | `hotfix/description` | Production fixes | Temporary |
| `release` | `release/version` | Release preparation | Temporary |

### Branch Naming

```
feature/mo-123-add-user-authentication
bugfix/mo-456-fix-login-validation
hotfix/fix-critical-security-issue
release/v1.2.0
```

Format: `type/ticket-number-short-description`

- Use lowercase
- Use hyphens (not underscores)
- Include ticket/issue number when applicable
- Keep description short (3-5 words)

### Branch Workflow

```
main (production)
  │
  └── develop (integration)
        │
        ├── feature/user-auth
        │     └── [merged to develop]
        │
        ├── feature/dashboard
        │     └── [merged to develop]
        │
        └── release/v1.2.0
              └── [merged to main and develop]
```

## Commit Messages

### Format

```
type(scope): subject

[optional body]

[optional footer]
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add password reset` |
| `fix` | Bug fix | `fix(api): resolve null pointer in user service` |
| `docs` | Documentation | `docs(readme): update installation steps` |
| `style` | Formatting | `style(lint): fix indentation` |
| `refactor` | Code restructuring | `refactor(user): extract validation logic` |
| `test` | Adding tests | `test(auth): add login integration tests` |
| `chore` | Maintenance | `chore(deps): update dependencies` |
| `perf` | Performance | `perf(query): optimize user search` |
| `ci` | CI changes | `ci(github): add coverage reporting` |
| `build` | Build changes | `build(docker): update base image` |

### Scope

Optional, indicates the component affected:
- `auth`, `api`, `ui`, `db`, `config`, `deps`

### Subject Rules

- Use imperative mood: "add" not "added" or "adds"
- Don't capitalize first letter
- No period at the end
- Maximum 50 characters

### Examples

```
feat(auth): add two-factor authentication

Implement TOTP-based 2FA for user accounts.

- Add QR code generation for authenticator apps
- Add backup codes for account recovery
- Update login flow to check for 2FA

Closes #123
```

```
fix(api): prevent duplicate user registration

Users could register with same email in race condition.
Add unique constraint check before insert.

Fixes #456
```

```
docs(api): update endpoint documentation

- Add examples for all endpoints
- Document error responses
- Include authentication requirements
```

### Commit Best Practices

1. **Atomic commits** - One logical change per commit
2. **Commit often** - Small, frequent commits over large, infrequent ones
3. **Test before commit** - Ensure tests pass
4. **Review diff** - Check what you're committing

```bash
# Check what will be committed
git diff --staged

# Commit with message
git commit -m "feat(user): add email verification"

# Commit with detailed message
git commit
# Opens editor for multi-line message
```

## Pull Requests

### Creating PRs

1. **Update branch** with latest from target branch
2. **Ensure tests pass** locally
3. **Fill out PR template** completely
4. **Self-review** the diff before requesting review

```bash
# Update feature branch from develop
git checkout feature/my-feature
git fetch origin
git rebase origin/develop

# Or merge (creates merge commit)
git merge origin/develop
```

### PR Title Format

Same as commit message:
```
feat(auth): implement OAuth2 login
fix(dashboard): resolve chart rendering issue
```

### PR Size

- Aim for **< 400 lines** of changes
- Split large features into multiple PRs
- Each PR should be **reviewable in 30 minutes**

### Merge Strategy

**Squash and merge** for feature branches:
- Keeps history clean
- All commits become one on target branch

```bash
# GitHub CLI
gh pr merge --squash
```

## Code Review

See [Code Review Guidelines](./code-review.md) for detailed practices.

### Before Requesting Review

- [ ] Self-reviewed the diff
- [ ] Tests pass locally
- [ ] Branch is up to date with target
- [ ] PR description is complete
- [ ] Screenshots/videos for UI changes

### As a Reviewer

- [ ] Check code logic and correctness
- [ ] Verify tests exist and are appropriate
- [ ] Look for security issues
- [ ] Check for performance concerns
- [ ] Ensure code follows style guidelines

## Common Git Operations

### Starting New Work

```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/mo-123-new-feature

# Work on feature
# ... make changes ...
git add -A
git commit -m "feat(scope): add feature"

# Push to remote
git push -u origin feature/mo-123-new-feature
```

### Updating Branch

```bash
# Rebase (preferred for feature branches)
git fetch origin
git rebase origin/develop

# If conflicts:
# 1. Resolve conflicts
# 2. git add <resolved files>
# 3. git rebase --continue

# Force push after rebase (only on your own branches!)
git push --force-with-lease
```

### Interactive Rebase

```bash
# Clean up commits before PR
git rebase -i HEAD~3

# In editor:
# pick abc123 First commit
# squash def456 Second commit
# squash ghi789 Third commit
```

### Stashing Changes

```bash
# Save current changes
git stash

# Apply stashed changes
git stash pop

# List stashes
git stash list

# Apply specific stash
git stash apply stash@{2}
```

### Undoing Changes

```bash
# Undo staged changes
git reset HEAD <file>

# Discard local changes
git checkout -- <file>

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

## Protected Branches

### main Branch

- Requires PR for all changes
- Requires passing CI checks
- Requires at least 1 approval
- No force pushes
- Only merge commits from release/hotfix

### develop Branch

- Requires PR for all changes
- Requires passing CI checks
- Squash merge from feature branches

## Release Process

```bash
# 1. Create release branch
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. Version bump, final testing, fixes

# 3. Merge to main
git checkout main
git merge --no-ff release/v1.2.0
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin main --tags

# 4. Merge back to develop
git checkout develop
git merge --no-ff release/v1.2.0
git push origin develop

# 5. Delete release branch
git branch -d release/v1.2.0
```

## Summary

| Practice | Guideline |
|----------|-----------|
| **Branching** | feature/bugfix/hotfix from develop |
| **Commits** | type(scope): subject format |
| **PRs** | Small, focused, < 400 lines |
| **Merging** | Squash merge for features |
| **Protected** | main and develop require PRs |

## Related Documents

- [Code Review](./code-review.md)
- [PR Guidelines](./pr-guidelines.md)
- [Documentation](./documentation.md)
