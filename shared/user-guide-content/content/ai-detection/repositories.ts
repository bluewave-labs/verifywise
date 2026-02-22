import type { ArticleContent } from '../../contentTypes';

export const repositoriesContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'The Repositories page lets you register GitHub repositories and configure automated scanning schedules. Instead of manually entering a repository URL each time, you can save repositories and have them scanned automatically on a daily, weekly, or monthly basis.',
    },
    {
      type: 'heading',
      id: 'adding-repository',
      level: 2,
      text: 'Adding a repository',
    },
    {
      type: 'paragraph',
      text: 'Click **Add repository** to open the registration form. Enter the GitHub repository URL in full format (`https://github.com/owner/repo`) or shorthand (`owner/repo`). You can optionally provide a display name and specify the default branch if it differs from `main`.',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Repository URL', text: 'Required. The GitHub URL of the repository to monitor.' },
        { bold: 'Display name', text: 'Optional. A friendly name shown in the table instead of the full URL.' },
        { bold: 'Default branch', text: 'The branch to scan. Defaults to `main`.' },
      ],
    },
    {
      type: 'heading',
      id: 'scheduled-scans',
      level: 2,
      text: 'Scheduled scans',
    },
    {
      type: 'paragraph',
      text: 'Enable the **Scheduled scans** toggle to have the repository scanned automatically. Choose a frequency and time that works for your team:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Daily', text: 'Runs every day at the specified hour (UTC)' },
        { bold: 'Weekly', text: 'Runs once per week on the chosen day and hour (UTC)' },
        { bold: 'Monthly', text: 'Runs once per month on the chosen day and hour (UTC)' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Scheduled scans run in the background and results appear automatically in the scan results page. The next scheduled scan time is shown in the **Next scan** column of the repositories table.',
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Scheduling recommendation',
      text: 'Schedule scans during off-peak hours to minimize impact on your GitHub API rate limits. Daily scans at 2:00 AM UTC are a good default for active repositories.',
    },
    {
      type: 'heading',
      id: 'repository-table',
      level: 2,
      text: 'Repository table',
    },
    {
      type: 'paragraph',
      text: 'The repositories table shows all registered repositories with the following columns:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Repository', text: 'Owner and name of the repository, or the display name if set' },
        { bold: 'Schedule', text: 'Current schedule status — shows frequency and time, or "Disabled" if scheduling is off' },
        { bold: 'Last scan', text: 'When the most recent scan ran and its status (completed, failed, etc.)' },
        { bold: 'Next scan', text: 'When the next scheduled scan will run, or "—" if scheduling is disabled' },
        { bold: 'Actions', text: 'Scan now, edit, and delete buttons' },
      ],
    },
    {
      type: 'heading',
      id: 'manual-scans',
      level: 2,
      text: 'Running a manual scan',
    },
    {
      type: 'paragraph',
      text: 'Click the play button in the actions column to trigger an immediate scan of a repository. The button shows a loading indicator while the scan is in progress. You can also start scans from the Scan page using the repository URL.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Only one scan can run per repository at a time. If a scan is already in progress, the play button is replaced with a loading indicator until the scan completes.',
    },
    {
      type: 'heading',
      id: 'editing-repository',
      level: 2,
      text: 'Editing a repository',
    },
    {
      type: 'paragraph',
      text: 'Click the pencil icon to edit a repository. You can update the display name, default branch, and schedule configuration. The repository URL cannot be changed after creation — delete and re-add the repository if you need to change the URL.',
    },
    {
      type: 'heading',
      id: 'deleting-repository',
      level: 2,
      text: 'Deleting a repository',
    },
    {
      type: 'paragraph',
      text: 'Click the trash icon to delete a repository. This removes the repository from the table and disables any scheduled scans. Past scan results for this repository are preserved in the scan results page.',
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'Deleting a repository cannot be undone. Scheduled scans will stop immediately. Past scan results are not affected.',
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'ai-detection',
          articleId: 'scanning',
          title: 'Scanning repositories',
          description: 'How to scan repositories for AI/ML usage',
        },
        {
          collectionId: 'ai-detection',
          articleId: 'settings',
          title: 'AI Detection settings',
          description: 'Configure GitHub tokens for private repository access',
        },
      ],
    },
  ],
};
