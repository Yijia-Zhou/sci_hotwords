var app = getApp()
var dblog = require('../../../utils/dblog.js')
var display = require('../../../utils/display.js')

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
        fontRes: this.cal_font_size(word.deris),
        baseword_len: display.count_display_length(word._id)
      })
      this.process_fre_text()
      this.explain_style_process()
      
      // 更新“朗读”内容
      if (!this.data.noAudio) {
        try {
          clearTimeout(this.data.audio_timeout)
          this.InnerAudioContext.destroy()
        } catch {}
        this.prepare_audio()
      }

      dblog.logWord(word._id)

      if(word.hasOwnProperty('derisIndex') && word.derisIndex > -1)
      {
        this.onDeriDetailWithIdx(word.derisIndex)
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
      this.do_play_audio()
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

    // 详解
    onDetails: function () {
      app.globalData.current_word_obj = this.properties.word
      console.log(app.globalData.current_word_obj)
      wx.navigateTo({
        url: '/child_package/pages/details/details',
      })
    },

    // 点击衍生词可显示该衍生词释义
    onDeriDetail: function (event) {
      dblog.logAction("onDeriDetail")
      var deri_obj = this.properties.word.deris[event.target.id.substr(4,1)]
      wx.showModal({
        title: deri_obj.word,
        content: (Boolean(deri_obj.bing)?'[机翻]'+deri_obj.bing:"暂无释义") + '\r\n 出现次数：' + String(deri_obj.count), 
        showCancel: false
      })
    },

    onDeriDetailWithIdx : function(derisIndex) {
      dblog.logAction("onDeriDetailWithIdx")
      var deri_obj = this.properties.word.deris[derisIndex]
      wx.showModal({
        title: deri_obj.word,
        content: (Boolean(deri_obj.bing)?'[机翻]'+deri_obj.bing:"暂无释义") + '\r\n 出现次数：' + String(deri_obj.count), 
        showCancel: false
      })
    },

    onMoreDeri: function () {
      app.globalData.current_word_obj = this.properties.word
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
     * 工具函数们
     */
    
     // 将词频信息处理成显示在卡片顶端的文字
    process_fre_text: function () {
      let word = this.properties.word
      let paper_count = app.globalData.dictInfo.dictNames[word.fromCluster][word.fromDict].paper_count
      if (typeof(paper_count) != "number") {
        paper_count = 1217564
      }
      let fre = this.properties.word.total_count / paper_count
      if (fre >= 5) {
        this.setData({fre_text: "每篇平均出现 "+String(fre.toFixed(2))+' 次'})
      } else if (fre >= 0.5) {
        this.setData({fre_text: "十篇平均出现 "+String((fre*10).toFixed(2))+' 次'})
      } else {
        this.setData({fre_text: "百篇平均出现 "+String((fre*100).toFixed(2))+' 次'})
      }
    },
  
    cal_font_size: function (deris) {
      let deris_copy = [...deris]
      for (let i in [0,0,0,0]) {
        deris_copy.push('')
      }
      let max_display_length = 0
      for (let i in [0,1,2,3]) {
        max_display_length = Math.max(max_display_length, display.count_display_length(deris_copy[i].word))
      }
      let fontRes = Math.min(44, 555/(max_display_length+1))
      return fontRes
    },

    explain_style_process() {
      let disp_len = display.count_display_length(this.properties.word.chosen[0])
      if (disp_len > 75) {
        this.setData({explain_style: "font-size:"+String(36*75/disp_len)+"rpx; line-height: 48.6rpx;"})
        return 0
      }
      this.setData({explain_style: ""})
    },

    prepare_audio() {
      // 预备“朗读”功能
      try {
        this.InnerAudioContext = wx.createInnerAudioContext()
        this.setData({
          showPlay: true
        })
        let word_obj = this.properties.word
        // word和deris的前四项合并，以"; "连接，一并朗读
        let words = word_obj._id
        if (word_obj.deris && word_obj.deris.length > 0) {
          let deris = word_obj.deris.slice(0, 4).map(item => item.word)
          words = words + "; " + deris.join("; ")
        }
        this.InnerAudioContext.src = 'https://dict.youdao.com/dictvoice?audio=' + encodeURI(words)
        this.InnerAudioContext.onEnded(() => {
          this.data.audio_timeout = setTimeout(this.InnerAudioContext.play, 1000)
        })
      } catch(e) {
        console.log(e)
        this.setData({
          noAudio: true
        })
      }
    },

    do_play_audio() {
      this.InnerAudioContext.play()
    },

    destroy_audio() {
      try {
        this.InnerAudioContext.destroy()
        clearTimeout(this.data.audio_timeout)
      } catch(e) {
        console.log(e)
      }
    }
  },

  /**
   * 组件生命周期函数们
  */
  lifetimes: {
    detached: function() {
      // 在组件实例被从页面节点树移除时执行
      this.destroy_audio()
    },
  },

  pageLifetimes: { // 组件所在页面的生命周期
    hide: function() {
      this.destroy_audio()
    },
    show: function() {
      this.prepare_audio()
    }
  }
})
