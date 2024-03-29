var app = getApp()
var reminder = require('../../sub_utils/reminder.js')
var display = require('../../sub_utils/display.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    difficulty: undefined,
    show_diff_setting: true,
    showDiffModal: false,

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

  on_showcase: function() {
    // 加载难度示例
    let diff_showcase_here = app.globalData.diff_showcase_here
    this.setData({
      showDiffModal: true,
      diff_showcase_here: diff_showcase_here
    })
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
      let oldDiffcultyThreshold = globalDictInfo.diff_thresholds[globalDictInfo.useDict]
      //necessary?
      if(oldDiffcultyThreshold != newDiffcultyThreshold)
      {
        app.words_need_reload = true
      }
      globalDictInfo.diff_thresholds[globalDictInfo.useDict] = newDiffcultyThreshold
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
    if (!app.globalData.dictInfo.hasOwnProperty('useDict') || app.globalData.dictInfo.useDict == '我的收藏') {
        this.setData({show_diff_setting: false})
    } else {
      this.setData({
        difficulty: app.globalData.dictInfo.diff_thresholds.hasOwnProperty(app.globalData.dictInfo.useDict)
        ? Math.round(app.globalData.dictInfo.diff_thresholds[app.globalData.dictInfo.useDict] * 100)
        : 0
      })
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