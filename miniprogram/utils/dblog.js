var userLog = new Array()
var currentLogNum = 0
var logNumLimit = 30

function reportUserLog() {
  const db = wx.cloud.database()
  db.collection('log').add({
    data : {
      userLog
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