# VerifyWise application: Workflow FAQ

### Pull Request (PR) Process

**How should developers submit a PR (e.g., from a feature branch)?**
Here are some links to help you learn how to make a _pull request_:

- [Basic Git Instructions: Making pull request to the original repository](https://github.com/MuhammadKhalilzadeh/basic-git-instructions?tab=readme-ov-file#making-pull-request-to-the-original-repository)
- [Git Collaborative Workflow Tutorial: Making a Pull Request](https://github.com/ajhollid/bluewave_collaborative_git?tab=readme-ov-file#making-a-pull-request)

**What is the preferred branch naming convention (e.g., feature/branch-name, bugfix/branch-name)?**

[Link to a brief description on our naming convention](https://github.com/MuhammadKhalilzadeh/basic-git-instructions?tab=readme-ov-file#checking-out-and-creating-a-new-branch)

Our naming convention for GitHub branches follows a structured and clear format: `[0-9][0-9][0-9]-[Month]-[Day]-[subject]`.

Here’s a breakdown of its components:
`[0-9][0-9][0-9]`: A three-digit number that can represent a unique identifier for the branch. It is essentially the number for your branch.

_Note: If something goes wrong while creating your branch, feel free to delete it or create a new one and simply increment the count._

`[Month]`: The abbreviated month name (e.g., Jan, Feb, Mar).
`[Day]`: The day of the month in two digits.
`[subject]`: A brief description of the branch’s purpose or the feature being worked on.

For example, `001-Mar-12-Dashboard` indicates:

`001`: The first branch or a unique identifier (e.g., the first branch you created).
`Mar`: The month of March.
`12`: The 12th day of the month.
`Dashboard`: The subject or feature being developed.

Note: If it's a bug fix, simply add `[bug-fix]` before the subject, like this: `001-Mar-12-bug-fix-Dashboard`

**Should PRs be tied to issues (e.g., "Closes #IssueNumber")?**
Since you will be forking the original repository, you will not be able to directly tie your branch to the issues. However, once you are done with an issue, you should ask the administrators to close the corresponding issue after the merge.

### Review Process

**How many reviewers are required to approve a PR before it can be merged?**
At least one full-stack developer and two developers in the same role as yourself (Frontend or Backend team) are required.

**Who should be responsible for reviewing (e.g., rotating reviewers, assigned leads)?**
Since we are at the beginning of our journey, it is beneficial for all team members to participate in reviewing the codebase. This provides hands-on experience in identifying potential bugs, errors, and possible enhancements. Additionally, it is mandatory to have at least one full-stack developer in the review process, as they bridge the frontend and backend.

**How should the team handle review feedback (e.g., requesting changes, discussion in comments)?**
Before making a pull request, reach out to your colleagues and peers to ensure everything is ready. It is better to have long discussions on Discord and reserve issues and pull requests for requesting changes, providing short practical guidance, and making comments.

**Should the PR author be allowed to merge their own PR after review?**
Everyone will be able to create issues and assign them to themselves.

### Issue Management:

**How will issues be created, assigned, and tracked?**
Issues will be created by the project manager and team leads. When creating an issue, it is very helpful to add insights, hints, or leads on how to address the issue. Feel free to use AI tools for help and ideas.

**Will we use GitHub Projects or a separate tool for project management?**
GitHub Projects is an excellent tool for managing our tasks.

