import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const milestoneName: string = core.getInput('milestone')
    const projectName: string = core.getInput('project')
    const projectColumnName: string = core.getInput('project_column')
    const action = github.context.payload.action
    const issue = github.context.payload.issue
    const milestone = await getMilestoneID(milestoneName)
    const project = await getProjectID(projectName)
    if (issue) {
      if (milestone) {
        await addIssueToMilestone(issue.number, milestone)
      }
      if (project) {
        const projectColumn = await getProjectColumnID(project, projectColumnName)
        if (projectColumn) {
          await addIssueToProject(issue.id, project, projectColumn)
        }
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

async function getMilestoneID(milestoneName: string): Promise<number | null> {
  const octokit = github.getOctokit(core.getInput('token'))
  const { data: milestones } = await octokit.issues.listMilestones({
    ...github.context.repo,
    state: "open"
  })
  const found = milestones.find(milestone => milestone.title == milestoneName)
  if (found != undefined) {
    return found.number
  }
  return null
}

async function addIssueToMilestone(issue: number, milestone: number): Promise<void> {
  const octokit = github.getOctokit(core.getInput('token'))
  await octokit.issues.update({
    ...github.context.repo,
    issue_number: issue,
    milestone: milestone
  })
}

async function getProjectID(projectName: string): Promise<number | null> {
  const octokit = github.getOctokit(core.getInput('token'))
  const { data: projects } = await octokit.projects.listForRepo({
    ...github.context.repo,
  })
  const found = projects.find(project => project.name == projectName)
  if (found != undefined) {
    return found.id
  }
  return null
}

async function getProjectColumnID(project: number, projectColumnName: string): Promise<number | null> {
  const octokit = github.getOctokit(core.getInput('token'))
  const { data: columns } = await octokit.projects.listColumns({
    project_id: project
  })
  const found = columns.find(column => column.name == projectColumnName)
  if (found != undefined) {
    return found.id
  }
  return null
}

async function addIssueToProject(issue: number, project: number, projectColumn: number): Promise<void> {
  const octokit = github.getOctokit(core.getInput('token'))
  const issueType = "Issue"
  await octokit.projects.createCard({
    column_id: projectColumn,
    project_id: project,
    content_id: issue,
    content_type: issueType,
  })
}

run()
