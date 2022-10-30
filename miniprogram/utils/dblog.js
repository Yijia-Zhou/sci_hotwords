var userLog = new Array()
var currentLogNum = 0
var logNumLimit = 30

function reportUserLog() {
  if (userLog.length == 0) {
    return 1
  }
  const db = wx.cloud.database()
  let deviceInfo = wx.getDeviceInfo()
  db.collection('log').add({
    data : {
      userLog,
      deviceInfo: {
        model: deviceInfo.model,
        system: deviceInfo.system,
        benchmarkLevel: deviceInfo.benchmarkLevel
      }
    },
    success: function() {
      userLog = new Array()
    }
  })
  return 0
}

function logAction(action) {
  if(currentLogNum < logNumLimit)
  {
    let logaction = new Object()
    logaction.action = action
    logaction.timeStamp = new Date().getTime()
    userLog.push(logaction)
    currentLogNum++
  }
  return 0
}

function logWord(wordIdx) {
  if(currentLogNum < logNumLimit)
  {
    let logWord = new Object()
    logWord.wordIdx = wordIdx
    logWord.timeStamp = new Date().getTime()
    userLog.push(logWord)
    currentLogNum++
  }
  return 0
}

module.exports.logAction     = logAction
module.exports.logWord       = logWord
module.exports.reportUserLog = reportUserLog