# VerifyWise application: Workflow FAQ

### Pull Request (PR) Process

**How should developers submit a PR (e.g., from a feature branch)?**
Here are links that help you to learn how to make a _pull request_:

- [Basic Git Instructions: Making pull request to the original repository](https://github.com/MuhammadKhalilzadeh/basic-git-instructions?tab=readme-ov-file#making-pull-request-to-the-original-repository)
- [Git Collaborative Workflow Tutorial: Making a Pull Request](https://github.com/ajhollid/bluewave_collaborative_git?tab=readme-ov-file#making-a-pull-request)

**What is the preferred branch naming convention (e.g., feature/branch-name, bugfix/branch-name)?**

[Link to a brief description on our naming convention](https://github.com/MuhammadKhalilzadeh/basic-git-instructions?tab=readme-ov-file#checking-out-and-creating-a-new-branch)

Our naming convention for GitHub branches follows a structured and clear format:
`[0-9][0-9][0-9]-[Month]-[Day]-[subject]`.

Here’s a breakdown of its components:
`[0-9][0-9][0-9]`: A three-digit number, which could represent a unique identifier for the branch. It is basically the No. for your branch.

_Note: even if something goes wrong with creating your branch, feel free to delete the branch or create a new one and simply add one more to the counting._

`[Month]`: The abbreviated month name (e.g., Jan, Feb, Mar).
`[Day]`: The day of the month in two digits.
`[subject]`: A brief description of the branch’s purpose or the feature being worked on.

For example, `001-Mar-12-Dashboard` indicates:

`001`: The first branch or a unique identifier, also the first branch you've created.
`Mar`: The month of March.
`12`: The 12th day of the month.
`Dashboard`: The subject or feature being developed.

Note: If it's a bug fix, simply add a `[bug-fix]` before the subject, like this:
`001-Mar-12-bug-fix-Dashboard`

**Should PRs be tied to issues (e.g., "Closes #IssueNumber")?**
Since you'll fork the original repository, therefore you will not be able to tie your branch you the issues, but whenever you're done with the issue, you should ask admins to close the issue after the merge.

### Review Process

**How many reviewers are required to approve a PR before it can be merged?**
At least 1 full-stack developer and 2 developers on the same position/role as yourself, whether you're Frontend or Backend team.

**Who should be responsible for reviewing (e.g., rotating reviewers, assigned leads)?**
Since we're on the beginning of our road, it is better for all of the team members to participate in the process of reviewing the codebase and getting a hands-on experience on how to review the code and find potential bugs, errors, and possible enhancements. Also, it is a must to have at least one of the full-stack developers on the review, since they are the bridge between frontend and backend.

**How should the team handle review feedback (e.g., requesting changes, discussion in comments)?**
Before making a pull request, reach out to you colleagues and peers and make sure everything is good to go. Better to do the long discussions on Discord and only requesting changes, short practical guidances and comments be on issues and pull requests.

**Should the PR author be allowed to merge their own PR after review?**
Everyone should will be able to create issues, and assign them to himself/herself.

### Issue Management:

**How will issues be created, assigned, and tracked?**
Issues will be created by project manager and leads. When you create an issue, it will be very helpful to try adding some insights, hints or leads on how to tackle the issue. Feel free to use AI tools to get helps and ideas about that.

**Will we use GitHub Projects or a separate tool for project management?**
GitHub Projects is an amazing tool to use for our tasks.

