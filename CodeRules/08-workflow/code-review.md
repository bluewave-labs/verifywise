# Code Review

Guidelines for effective code reviews in VerifyWise.

## Purpose of Code Review

1. **Catch bugs** before they reach production
2. **Share knowledge** across the team
3. **Maintain quality** and consistency
4. **Improve** both code and skills

## Reviewer Responsibilities

### What to Look For

#### 1. Correctness

- Does the code do what it's supposed to?
- Are edge cases handled?
- Does the logic make sense?

```typescript
// Look for logic errors
// Example: Off-by-one error
for (let i = 0; i <= items.length; i++) { // Should be < not <=
  process(items[i]); // items[items.length] is undefined
}
```

#### 2. Design

- Is this the right approach?
- Is it over-engineered or under-engineered?
- Does it follow existing patterns?

```typescript
// Flag unnecessary complexity
// Question: Does this need to be a class?
class StringFormatter {
  format(s: string): string {
    return s.trim().toLowerCase();
  }
}

// Could be simpler
const formatString = (s: string) => s.trim().toLowerCase();
```

#### 3. Security

- Is user input validated?
- Are secrets handled properly?
- Could this introduce vulnerabilities?

```typescript
// Flag security issues
// Bad: SQL injection risk
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// Good: Parameterized query
const user = await User.findByPk(userId);
```

#### 4. Performance

- Are there obvious performance issues?
- N+1 queries?
- Unnecessary computation?

```typescript
// Flag performance issues
// Bad: N+1 query
const users = await User.findAll();
for (const user of users) {
  user.orders = await Order.findAll({ where: { userId: user.id } });
}

// Good: Eager loading
const users = await User.findAll({
  include: [{ model: Order, as: 'orders' }],
});
```

#### 5. Tests

- Are there adequate tests?
- Do tests cover edge cases?
- Are tests meaningful?

```typescript
// Flag missing test cases
describe('calculateDiscount', () => {
  it('calculates discount', () => {
    expect(calculateDiscount(100, 10)).toBe(90);
  });
  // Missing: negative values, zero, max discount, etc.
});
```

#### 6. Readability

- Is the code clear and understandable?
- Are names meaningful?
- Is there unnecessary complexity?

```typescript
// Flag unclear code
// Bad
const x = data.filter(d => d.a && !d.b).map(d => d.c * 2);

// Good
const activeItems = data.filter(item => item.isActive && !item.isArchived);
const doubledPrices = activeItems.map(item => item.price * 2);
```

### What NOT to Focus On

- **Style nitpicks** - Let linters handle formatting
- **Personal preferences** - "I would have done it differently"
- **Theoretical problems** - Focus on actual issues

## Providing Feedback

### Be Constructive

```
❌ "This is wrong"
✅ "This might cause issues when X is null. Consider adding a check."

❌ "Bad naming"
✅ "Could we rename `data` to `userProfiles` for clarity?"

❌ "Don't do this"
✅ "Consider using X instead because Y."
```

### Use Prefixes

| Prefix | Meaning |
|--------|---------|
| `[blocking]` | Must fix before merge |
| `[suggestion]` | Take it or leave it |
| `[question]` | Need clarification |
| `[nitpick]` | Minor, non-blocking |
| `[praise]` | Something done well |

### Examples

```
[blocking] This could cause a SQL injection. Please use parameterized queries.

[suggestion] Consider extracting this into a separate function for reusability.

[question] Why did we choose this approach over X?

[nitpick] Extra whitespace on line 42.

[praise] Great use of early returns here! Makes the code much cleaner.
```

### Comment on Code, Not People

```
❌ "You forgot to handle the error case"
✅ "The error case doesn't appear to be handled here"

❌ "You always write tests this way"
✅ "This test could be more descriptive"
```

## Author Responsibilities

### Before Requesting Review

- [ ] Self-review your own diff
- [ ] Ensure tests pass
- [ ] Fill out PR description
- [ ] Keep PR focused and small

### Self-Review Checklist

- [ ] No console.log or debugging code
- [ ] No commented-out code
- [ ] Variable names are clear
- [ ] Complex logic has comments
- [ ] Tests cover the changes
- [ ] No sensitive data exposed

### Responding to Feedback

- **Don't take it personally** - Reviews are about code, not you
- **Explain your reasoning** if you disagree
- **Thank reviewers** for their time
- **Ask questions** if feedback is unclear

```
Reviewer: "Consider using a Map here for O(1) lookup"

Good response:
"Good point! However, we're only dealing with ~10 items max, so I think
the array lookup is fine and more readable. What do you think?"

Bad response:
"It's fine the way it is"
```

## Review Process

### Timeline

- **Start review** within 4 business hours of request
- **Complete review** within 1 business day
- **Respond to comments** within 4 hours
- **Re-review** within 4 hours of updates

### Approval Criteria

1. All tests pass
2. No blocking comments unresolved
3. Code follows guidelines
4. No security concerns

### Requesting Changes

```markdown
## Changes Requested

This PR needs the following before merge:

1. [ ] Add error handling for the API call
2. [ ] Add tests for edge case when user is null
3. [ ] Update the README with new configuration

Once addressed, please re-request review.
```

## Review Checklist

### General

- [ ] Code compiles without errors
- [ ] No obvious bugs or logic errors
- [ ] Error handling is appropriate
- [ ] No security vulnerabilities introduced

### Architecture

- [ ] Follows existing patterns
- [ ] Appropriate separation of concerns
- [ ] No unnecessary complexity
- [ ] Changes are in the right location

### Quality

- [ ] Tests are present and meaningful
- [ ] Code is readable and maintainable
- [ ] Comments explain "why" not "what"
- [ ] No dead code or TODOs without tickets

### Security

- [ ] Input is validated
- [ ] No hardcoded secrets
- [ ] Authentication/authorization checked
- [ ] Data is sanitized

### Performance

- [ ] No N+1 queries
- [ ] Appropriate caching
- [ ] No unnecessary computation
- [ ] Database queries are efficient

## Pair Review Sessions

For complex changes, consider synchronous review:

1. **Schedule 30-minute call**
2. **Author walks through changes**
3. **Discuss design decisions**
4. **Reviewer asks questions live**
5. **Document decisions in PR**

## Summary

| Role | Focus |
|------|-------|
| **Reviewer** | Be constructive, focus on important issues |
| **Author** | Be receptive, explain reasoning |
| **Both** | Keep communication respectful |

## Related Documents

- [Git Workflow](./git-workflow.md)
- [PR Guidelines](./pr-guidelines.md)
- [PR Checklist](../checklists/pr-checklist.md)
