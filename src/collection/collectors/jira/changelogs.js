const issueUtil = require('./issues')

const dbConnector = require('@mongo/connection')
const fetcher = require('./fetcher')

const collectionName = 'jira_issue_changelogs'

module.exports = {
  async collect (options) {
    const issues = await issueUtil.findIssues({ 'fields.project.name': options.projectId }, options.db)

    const changelogCollection = await dbConnector.findOrCreateCollection(options.db, collectionName)
    let promises = []
    for (const issue of issues) {
      // todo we cant have this line. It needs to be a promise.all async
      const changelog = await module.exports.fetchChangelogForIssue(issue.id)
      console.log('JON >>> changelog', changelog)
      for (const change of changelog.values) {
        // todo we need to add our own primary key
        // todo only update based on primary key
        promises.push(changelogCollection.insertOne({
          issueId: issue.id,
          ...change
        }))
      }
    }
    await Promise.all(promises)
  },

  async fetchChangelogForIssue (issueId) {
    const requestUri = `issue/${issueId}/changelog`

    return fetcher.fetch(requestUri)
  },

  async findChangelogs (where, db, limit = 999999, sort = { createdAt: 1 }) {
    const changelogCollection = await dbConnector.findOrCreateCollection(db, collectionName)
    const changelogsCursor = await changelogCollection.find(where).limit(limit).sort(sort)

    return await changelogsCursor.toArray()
  }
}
