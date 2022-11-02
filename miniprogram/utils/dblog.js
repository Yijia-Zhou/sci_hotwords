var userLog = new Array()
var currentLogNum = 0
var logNumLimit = 30
var app = getApp()

function reportUserLog() {
  if (userLog.length == 0) {
    return 1
  }
  const db = wx.cloud.database()
  try {
    var deviceInfo = wx.getDeviceInfo()
  } catch {
    var deviceInfo = {
      model: "开发者工具"
    }
  }
  db.collection('log').add({
    data : {
      userLog,
      deviceInfo: {
        model: deviceInfo.model,
        system: deviceInfo.system,
        benchmarkLevel: deviceInfo.benchmarkLevel
      },
      useMode: app.globalData.dictInfo.useMode,
    },
    success: function() {
      userLog = new Array()
      currentLogNum = 0
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