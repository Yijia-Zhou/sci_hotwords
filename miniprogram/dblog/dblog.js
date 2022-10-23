function logInfo(context) {
  const db = wx.cloud.database()
  db.collection('log').add({
    data: {
      loginfo: {
        context
      }
    }
  })
  return 0
}

function logAction(action) {
  let logaction = new Object()
  logaction.action = action
  logaction.timeStamp = new Date().getTime()
  logInfo(logaction)
  return 0
}

module.exports.logAction = logAction