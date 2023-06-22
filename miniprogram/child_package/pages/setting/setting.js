var app = getApp()
var reminder = require('../../../utils/reminder.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    difficulty: undefined,
    show_diff_setting: true,

    highschool_filter_array: ["保留它们", "屏蔽它们"],
    highschool_filter_index: app.globalData.dictInfo.no_high_school ? 1 : 0,

    daily_target_array: [...Array(100).keys()].slice(5),
    daily_target_index: app.globalData.dictInfo.hasOwnProperty('daily_target') ? app.globalData.dictInfo.daily_target-5 : 25,

    remind_time: app.globalData.dictInfo.hasOwnProperty('remind_time') ? app.globalData.dictInfo.remind_time : '12:25',

    show_highschool: app.globalData.dictInfo.hasOwnProperty('no_high_school')
  },

  on_changing_diff: function(e) {
    this.setData({difficulty: e.detail.value})
  },

  on_high_school_change: function(e) {
    this.setData({highschool_filter_index: e.detail.value})
  },

  on_daily_target_change: function(e) {
    this.setData({daily_target_index: e.detail.value})
  },

  on_remind_time_change: function(e) {
    this.setData({remind_time: e.detail.value})
  },

  on_set_reminder: function () {
    reminder.requestReminder(this.data.remind_time)
  },

  onConfirm: function () {
    let globalDictInfo = app.globalData.dictInfo

    if (this.data.show_diff_setting) {
      let newDiffcultyThreshold = this.data.difficulty / 100
      let oldDiffcultyThreshold = globalDictInfo.dictNames.生命科学[globalDictInfo.useDict].diff_threshold
      //necessary?
      if(oldDiffcultyThreshold != newDiffcultyThreshold)
      {
        app.words_need_reload = true
      }
      globalDictInfo.dictNames.生命科学[globalDictInfo.useDict].diff_threshold = newDiffcultyThreshold
    }
    
    globalDictInfo.daily_target = this.data.daily_target_array[this.data.daily_target_index]
    globalDictInfo.remind_time = this.data.remind_time

    if (this.data.highschool_filter_array[this.data.highschool_filter_index]=="屏蔽它们") {
      globalDictInfo.no_high_school = true
    } else if (globalDictInfo.hasOwnProperty('no_high_school')) {
      if (globalDictInfo.no_high_school != false) {
        //necessary?
        app.words_need_reload = true
        globalDictInfo.no_high_school = false
      }
    }

    wx.setStorageSync('dictInfo', globalDictInfo)
    wx.navigateBack()
  },

  onCancel: function () {
    wx.navigateBack()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    try {
      this.setData({
        difficulty: app.globalData.dictInfo.dictNames.生命科学[app.globalData.dictInfo.useDict].hasOwnProperty('diff_threshold')
        ? Math.round(app.globalData.dictInfo.dictNames.生命科学[app.globalData.dictInfo.useDict].diff_threshold * 100)
        : 0
      })
    } catch(e) {
      if (e instanceof TypeError) {
        console.log(e)
        this.setData({show_diff_setting: false})
      } else {
        console.error(e)
      }
    }

    this.setData({
      highschool_filter_index: app.globalData.dictInfo.no_high_school ? 1 : 0,
      daily_target_index: app.globalData.dictInfo.hasOwnProperty('daily_target') ? app.globalData.dictInfo.daily_target-5 : 25,
      remind_time: app.globalData.dictInfo.hasOwnProperty('remind_time') ? app.globalData.dictInfo.remind_time : '12:25'
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    return app.onShareAppMessage(res)
  },
})