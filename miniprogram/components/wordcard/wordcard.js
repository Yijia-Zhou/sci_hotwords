// components/wordcard/wordcard.js
var dblog = require('../../utils/dblog.js')
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
  }
})
