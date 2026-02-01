# Pull Request Guidelines

Best practices for creating and managing pull requests in VerifyWise.

## PR Template

The project uses a PR template (`.github/pull_request_template.md`) that must be completed for all PRs.

### Template Sections

```markdown
## Describe your changes

Provide a concise description of the changes made and their intended purpose.

## Write your issue number after "Fixes "

Enter the corresponding issue number after "Fixes #"

## Please ensure all items are checked off before requesting a review:

- [ ] I deployed the code locally.
- [ ] I have performed a self-review of my code.
- [ ] I have included the issue # in the PR.
- [ ] I have labelled the PR correctly.
- [ ] The issue I am working on is assigned to me.
- [ ] I have avoided using hardcoded values to ensure scalability and maintain consistency across the application.
- [ ] I have ensured that font sizes, color choices, and other UI elements are referenced from the theme.
- [ ] My pull request is focused and addresses a single, specific feature.
- [ ] If there are UI changes, I have attached a screenshot or video to this PR.
```

## PR Title

Use the same format as commit messages:

```
type(scope): subject
```

Examples:
```
feat(auth): implement OAuth2 login with Google
fix(dashboard): resolve chart not updating on data change
docs(api): add endpoint documentation for user routes
refactor(user-service): extract validation logic to separate module
```

## PR Description

### What to Include

1. **Summary** - What does this PR do?
2. **Context** - Why is this change needed?
3. **Approach** - How was this implemented?
4. **Testing** - How was this tested?
5. **Screenshots** - For UI changes

### Example Description

```markdown
## Summary

Implements password reset functionality allowing users to reset their password
via email link.

## Context

Users have been locked out of accounts with no way to recover. This addresses
issue #123.

## Changes

- Add `/api/v1/auth/forgot-password` endpoint
- Add `/api/v1/auth/reset-password` endpoint
- Create email template for reset link
- Add password reset token model
- Update user service with reset methods

## Testing

- [x] Unit tests for password reset service
- [x] Integration tests for API endpoints
- [x] Manual testing of full flow
- [x] Tested with expired token
- [x] Tested with invalid token

## Screenshots

### Password Reset Request Form
![Reset form](./screenshots/reset-form.png)

### Password Reset Email
![Reset email](./screenshots/reset-email.png)
```

## PR Size

### Keep PRs Small

| Lines Changed | Rating |
|---------------|--------|
| < 200 | Excellent |
| 200-400 | Good |
| 400-800 | Acceptable |
| > 800 | Too large - split it |

### Why Small PRs?

1. **Faster reviews** - Reviewers can focus
2. **Better feedback** - Easier to catch issues
3. **Quicker merges** - Less chance of conflicts
4. **Easier rollback** - If issues arise

### Splitting Large PRs

If your PR is getting large:

1. **Split by layer**: API → Service → UI
2. **Split by feature**: User list → User detail → User edit
3. **Split preparation**: Refactoring → New feature
4. **Create stacked PRs**: PR1 → PR2 → PR3

## PR Labels

Use labels to categorize PRs:

| Label | Description |
|-------|-------------|
| `feature` | New feature |
| `bug` | Bug fix |
| `documentation` | Documentation changes |
| `refactor` | Code refactoring |
| `breaking` | Contains breaking changes |
| `needs-review` | Ready for review |
| `work-in-progress` | Not ready for review |
| `blocked` | Waiting on something |

## Draft PRs

Use draft PRs for:

- Work in progress
- Early feedback requests
- Sharing approach before completion

```bash
# Create draft PR
gh pr create --draft --title "feat(auth): add 2FA" --body "WIP"

# Mark ready for review
gh pr ready
```

## Review Request

### Who to Request

- Request from **2 reviewers** minimum
- Include **domain experts** for complex changes
- Include **security reviewer** for auth/security changes

### When to Request

- All checks pass
- PR description complete
- Self-review done
- No WIP commits

## Addressing Review Comments

### For Each Comment

1. **Address it** - Make the change
2. **Discuss it** - If you disagree
3. **Resolve it** - When addressed

### Responding to Feedback

```
Reviewer: Consider using a constant for this magic number

Good responses:
✅ "Done! Added MAX_RETRY_ATTEMPTS constant"
✅ "I kept it as-is because this value is only used here and is
    unlikely to change. Let me know if you still prefer a constant."

Bad responses:
❌ "OK"
❌ "Fixed"
❌ (No response)
```

### Re-requesting Review

After addressing comments:

1. Respond to all comments
2. Push changes
3. Re-request review from the same reviewers

```bash
# Re-request review via CLI
gh pr edit --add-reviewer @username
```

## Merging

### Prerequisites

- [ ] All checks pass
- [ ] Required approvals received
- [ ] No unresolved comments
- [ ] Branch is up to date

### Merge Method

**Squash and merge** (default):
- Combines all commits into one
- Keeps history clean
- Uses PR title as commit message

```bash
# Merge via CLI
gh pr merge --squash --delete-branch
```

### After Merging

1. Delete the feature branch
2. Verify deployment (if auto-deploy)
3. Close related issues

## Troubleshooting

### Merge Conflicts

```bash
# Update branch with target
git fetch origin
git rebase origin/develop

# Resolve conflicts, then:
git add .
git rebase --continue

# Push (force with lease for safety)
git push --force-with-lease
```

### Failed Checks

1. Check CI logs for errors
2. Fix issues locally
3. Push fixes
4. Checks run automatically

### Stuck Review

If review is taking too long:

1. Ping reviewers in comments
2. Mention in team channel
3. Request alternative reviewers

## Summary

| Aspect | Guideline |
|--------|-----------|
| **Title** | `type(scope): subject` |
| **Size** | < 400 lines preferred |
| **Description** | Summary, context, testing, screenshots |
| **Labels** | Categorize appropriately |
| **Reviews** | 2+ reviewers, address all comments |
| **Merge** | Squash and delete branch |

## Related Documents

- [Git Workflow](./git-workflow.md)
- [Code Review](./code-review.md)
- [PR Checklist](../checklists/pr-checklist.md)
