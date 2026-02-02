# Pull Request Checklist

Expanded checklist for pull request submissions in VerifyWise.

## Pre-Submission Checklist

### Code Quality

- [ ] I have performed a self-review of my code
- [ ] My code follows the project's style guidelines
- [ ] I have removed all debugging code (console.log, debugger, etc.)
- [ ] I have removed all commented-out code
- [ ] Variable and function names are clear and descriptive
- [ ] Complex logic has explanatory comments

### Functionality

- [ ] I have deployed and tested the code locally
- [ ] The feature/fix works as expected
- [ ] Edge cases have been considered and handled
- [ ] Error states are handled gracefully

### Testing

- [ ] I have written tests for new functionality
- [ ] All existing tests pass
- [ ] Test coverage meets minimum requirements (80%)
- [ ] Tests are meaningful (not just for coverage)

### Security

- [ ] User input is validated and sanitized
- [ ] No sensitive data is logged or exposed
- [ ] Authentication/authorization is properly implemented
- [ ] No hardcoded secrets or credentials
- [ ] SQL injection prevention verified (parameterized queries)

### Performance

- [ ] No unnecessary database queries
- [ ] No N+1 query issues
- [ ] Large data sets are paginated
- [ ] No expensive operations in loops

### UI/UX (if applicable)

- [ ] UI elements use theme references (not hardcoded values)
- [ ] Font sizes reference theme typography
- [ ] Colors reference theme palette
- [ ] Component is responsive
- [ ] Accessibility requirements met (ARIA labels, keyboard navigation)
- [ ] Screenshots/video attached for UI changes

### Documentation

- [ ] Code is self-documenting with clear names
- [ ] Complex logic is commented
- [ ] Public APIs have JSDoc/docstrings
- [ ] README updated if needed

### Git

- [ ] Commit messages follow conventional format
- [ ] Branch is up to date with target branch
- [ ] PR title follows format: `type(scope): description`
- [ ] PR description is complete and clear
- [ ] Issue number is linked (Fixes #xxx)

### Project Standards

- [ ] Issue is assigned to me
- [ ] PR is labeled correctly
- [ ] PR addresses a single, focused feature
- [ ] No unrelated changes included

## Quick Reference

### PR Title Format
```
type(scope): short description
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Commit Message Format
```
type(scope): subject

[body]

[footer]
```

### Size Guidelines
- Aim for < 400 lines of changes
- Split large PRs into smaller ones

## Before Requesting Review

1. ✅ All items above checked
2. ✅ CI/CD pipeline passes
3. ✅ Self-review completed
4. ✅ PR description filled out
5. ✅ Screenshots attached (for UI)

## Related Documents

- [PR Guidelines](../08-workflow/pr-guidelines.md)
- [Code Review](../08-workflow/code-review.md)
- [Git Workflow](../08-workflow/git-workflow.md)
