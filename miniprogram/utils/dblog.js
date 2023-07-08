var userLog = new Array()
var currentLogNum = 0
var logNumLimit = 30
var app = getApp()

function reportUserLog() {
  if (userLog.length == 0) {
    return 1
  }
  const db = wx.cloud.database()
  const deviceInfo = wx.getDeviceInfo()
  let temp = {
    userLog,
    deviceInfo: {
      model: deviceInfo.model,
      system: deviceInfo.system,
      benchmarkLevel: deviceInfo.benchmarkLevel
    },
    useMode: app.globalData.dictInfo.useMode,
    useDict: app.globalData.dictInfo.useDict,
    scene: wx.getLaunchOptionsSync().scene
  }
  try {
    temp.difficulty_setting = app.globalData.dictInfo.diff_thresholds[temp.useDict]
  } catch {}
  db.collection('log').add({
    data : temp,
    success: function() {
      userLog = new Array()
      currentLogNum = 0
    }
  })
  return 0
}

function logAction(action, value=undefined) {
  if(currentLogNum < logNumLimit)
  {
    let logaction = new Object()
    logaction.action = action
    if (value) {
      logaction.value = value
    }
    logaction.timeStamp = new Date().getTime()
    userLog.push(logaction)
    currentLogNum++
  }
  return 0
}

function logWord(wordIdx) {
  if(currentLogNum < logNumLimit)
  {
    logAction("loadWord", wordIdx)
    // let logWord = new Object()
    // logWord.wordIdx = wordIdx
    // logWord.timeStamp = new Date().getTime()
    // userLog.push(logWord)
    // currentLogNum++
  }
  return 0
}

module.exports.logAction     = logAction
module.exports.logWord       = logWord
module.exports.reportUserLog = reportUserLog