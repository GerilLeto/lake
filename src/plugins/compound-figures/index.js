require('module-alias/register')
const { isArray } = require('lodash')

module.exports = {
  configuration: {
    // default configuration which could be overrided by `config/plugins.js`
    enrichment: {
      jiraBoardId2GitlabProjectId: {
      }
    }
  },

  configure (configuration) {
    module.exports.configuration = configuration
  },

  async initialize (rawDb, enrichedDb, plugins) {
    const { configuration: { enrichment: { jiraBoardId2GitlabProjectId } } } = module.exports

    const { JiraBoardGitlabProject } = enrichedDb
    // remove all board-to-repo mapping
    await JiraBoardGitlabProject.destroy({ where: {}, truncate: true })
    // sync from configuration to database for JOIN query
    for (let [boardId, projectIds] of Object.entries(jiraBoardId2GitlabProjectId)) {
      if (!isArray(projectIds)) {
        projectIds = [projectIds]
      }
      for (const projectId of projectIds) {
        await JiraBoardGitlabProject.create({ boardId, projectId })
      }
    }
  },
  enricher: {
    name: 'compoundFiguresEnricher',
    exec: async function (rawDb, enrichedDb, options) {
      // await enrichment.enrich(rawDb, enrichedDb, options)
      return []
    }
  }
}

if (require.main === module) {
  const dbConnector = require('@mongo/connection')
  const enrichedDb = require('@db/postgres');

  (async function () {
    const { db, client } = await dbConnector.connect()
    try {
      await module.exports.initialize(db, enrichedDb, {})
    } finally {
      dbConnector.disconnect(client)
    }
  })()
}
