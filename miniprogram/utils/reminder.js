function requestReminder(changed_time) {
    let tmplId = 'fIbeAXEbSJXGLeVhkuTxth5JrxvXw3sweb0NGd8a83c'
    var remind_time = changed_time ? changed_time : this.globalData.dictInfo.remind_time
    if (!remind_time) {
      remind_time = '12:25'
    }
    wx.requestSubscribeMessage({
      tmplIds: [tmplId],
      success (res) {
        console.log(res)
        if (res[tmplId]=='accept') {
          let db = wx.cloud.database()
          let remind_time_obj = new Date(new Date().getTime()+72000000)
          remind_time_obj.setHours(remind_time.split(':')[0])
          remind_time_obj.setMinutes(remind_time.split(':')[1])
          remind_time_obj.setSeconds(0)
          db.collection('reminder').add({
            data: {
              remind_time_ms: remind_time_obj.getTime()
            }
          })
          wx.showToast({
            title: "将于明天 "+remind_time+" 给您发送征服SCI单词提醒 (^◡^) 您可以再随意地看些单词，或是养精蓄锐明天继续",
            duration: 3600,
            icon: 'none'
          })
        }
      }
    })
}

module.exports.requestReminder = requestReminder