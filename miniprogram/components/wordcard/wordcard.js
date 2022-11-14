// components/wordcard/wordcard.js
var dblog = require('../../utils/dblog.js')
var app = getApp()
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    word : {
        type : Object
    },
    showChinese :{
        type : Boolean,
        default :true
    }
  },

  observers: {
    'word': function(word) {
        console.log(word)
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    showPlay: true,
    noAudio: false
  },

  /**
   * 组件生命周期函数们
  */
  lifetimes: {
    ready: function() {
      // 组件生命周期函数 - 在组件布局完成后执行
      console.log(this.properties.word)
      this.setData({fontRes: this.calFontSize(this.properties.word.deris)})
      // 预备“朗读”功能
      if (app.globalData.offline) {
        this.setData({
          noAudio: true
        })
      } else {
        try {
          this.InnerAudioContext = wx.createInnerAudioContext()
          this.InnerAudioContext.src = 'https://dict.youdao.com/dictvoice?audio=' + this.properties.word._id
          this.InnerAudioContext.onEnded(() => {
            this.data.audio_timeout = setTimeout(this.onPlay, 1000)
          })
        } catch(e) {
          console.log(e)
          this.setData({
            noAudio: true
          })
        }
      }
    },
    detached: function() {
      // 在组件实例被从页面节点树移除时执行
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
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
        console.log('')
        }
        this.InnerAudioContext.pause()
        this.setData({
        showPlay: true,
        })
    },
    onShowChinese: function () {
        dblog.logAction("ShowChinese")
        this.setData({showChinese: true})
    },

    display_length_count: function (word) {
      // 计算单词显示长度，单位：a 显示时占用 1 长度（过程中 a 等记为 14 长度，故最后除以14）
      var res = 0
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
      console.log(deris)
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
  }
})
