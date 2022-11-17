var dblog = require('../../../utils/dblog.js')
var app = getApp()

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    word : {
      type : Object
    },
  },

  observers: {
    'word': function(word) {
      if (JSON.stringify(word) === '{}') {
        return 1
      }

      this.setData({
        useMode: app.globalData.dictInfo.useMode,
        showChinese: false, //记录检验模式中点击显示释义动作
        showPlay: true,
        fontRes: this.calFontSize(word.deris)
      })
      
      // 更新“朗读”内容
      if (!this.data.noAudio) {
        try {
          this.InnerAudioContext.destroy()
        } catch {}

        // 预备“朗读”功能
        try {
          this.InnerAudioContext = wx.createInnerAudioContext()
          this.setData({
            showPlay: true
          })
          this.InnerAudioContext.src = 'https://dict.youdao.com/dictvoice?audio=' + this.properties.word._id
          this.InnerAudioContext.onEnded(() => {
            this.data.audio_timeout = setTimeout(this.InnerAudioContext.play, 1000)
          })
        } catch(e) {
          console.log(e)
          this.setData({
            noAudio: true
          })
        }
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    useMode: app.globalData.dictInfo.useMode,
    showChinese: false, //记录检验模式中点击显示释义动作
    showPlay: true,
    noAudio: Boolean(app.globalData.offline)
  },

  /**
   * 组件的方法列表
   */
  methods: {

    /**
     * 操作响应函数（bingtap/catchtap/...）们，按点按区域从上至下排列
     */

    // “朗读”与“暂停”
    onPlay: function () {
      dblog.logAction("onPlay")
      this.InnerAudioContext.play()
      this.setData({
        showPlay: false,
      })
    },
    onPause: function () {
      try {
        clearTimeout(this.data.audio_timeout)
      } catch {
        console.log('no audio_timeout')
      }
      this.InnerAudioContext.pause()
      this.setData({
        showPlay: true,
      })
    },

    // 点击衍生词可显示该衍生词释义
    onDeriDetail: function (event) {
      dblog.logAction("onDeriDetail")
      var deri_obj = this.properties.word.deris[event.target.id.substr(4,1)]
      wx.showModal({
        title: deri_obj.word,
        content: (Boolean(deri_obj.bing)?deri_obj.bing:"暂无释义") + '\r\n 词频：' + String(deri_obj.count), 
        showCancel: false
      })
    },

    onMoreDeri: function () {
      app.globalData.deris_array = this.properties.word.deris
      wx.navigateTo({
        url: '/child_package/pages/more_deri/more_deri',
      })
      // this.setData({
      //   showMoreDeri: !this.data.showMoreDeri
      // })
      // wx.pageScrollTo({
      //   duration: 0,
      //   scrollTop: 0
      // }) // 将“更多衍生词”界面滚动条回位
    },

    onShowChinese: function () {
      dblog.logAction("onShowChinese")
      this.setData({showChinese: true})
    },

    /**
     * 工具函数们，目前就俩算字号的
     */
    
    // 计算单词显示长度，单位：a 显示时占用 1 长度（过程中 a 等记为 14 长度，故最后除以14）
    display_length_count: function (word) {
      let res = 0
      for (let char in word) {
        switch(word[char]) { // 用法参考 https://blog.csdn.net/tel13259437538/article/details/83314965
          case 'i':
          case 'j':
          case 'l':
            res += 6
            break
          case 'f':
          case 'r':
          case 't':
            res += 10
            break
          case 'm':
          case 'w':
            res += 20
            break
          default:
            res += 14
        }
      }
      return res/14
    },
  
    calFontSize: function (deris) {
      let deris_copy = [...deris]
      for (let i in [0,0,0,0]) {
        deris_copy.push('')
      }
      let max_display_length = 0
      for (let i in [0,1,2,3]) {
        max_display_length = Math.max(max_display_length, this.display_length_count(deris_copy[i].word))
      }
      let fontRes = Math.min(44, 555/(max_display_length+1))
      return [fontRes, fontRes, fontRes, fontRes]
    },
  },

  /**
   * 组件生命周期函数们
  */
  lifetimes: {
    detached: function() {
      // 在组件实例被从页面节点树移除时执行
      try {
        this.InnerAudioContext.destroy()
        clearTimeout(this.data.audio_timeout)
      } catch(e) {
        console.log(e)
      }
    },
  },

  pageLifetimes: { // 组件所在页面的生命周期
    hide: function() {
      this.detached()
    }
  }
})
