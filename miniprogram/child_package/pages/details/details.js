var app = getApp()
const db = wx.cloud.database()
var dblog = require('../../../utils/dblog.js')

function grouping(raw_string, word_list) {
  // 我需要对一个多行字符串raw_string进行分割，得到一个结果列表result, 规则如下：
  // raw_string中的每一行，如果其包含一个单词列表word_list中的单词（大小写模糊），且该单词所处位置与行首中间无中文，则该行成为一个起始行；
  // 如果一行的开头是“其它”或“其他”，那么该行也成为一个起始行
  // result中的每个元素由每个起始行以及其后跟随的（若存在）非起始行组成
  // 以上的目的就是把每个单词的详解部分划分成一个单独的段落以优化显示效果
  const lines = raw_string.split('\n');
  const result = [];
  let currentChunk = [];
  
  lines.forEach(line => {
    // 判断是否包含word_list中的单词
    const found = word_list.some(word => {
      const re = new RegExp(`^(?:\\d+\\.\\s|["']${word}|${word}).*`, 'i');  // 匹配以word开头的字符串（大小写不敏感，可能前面还有单引号或双引号）或以"数字."开头的字符串
      return re.test(line.trim()) && !/[\u4e00-\u9fa5]/.test(line.slice(0, 4));
    });

    // 判断是否以"其他"或"其它"开头
    const isOther = /^其他|^其它|^以上|^这些|^简单|^简要|^概括|^此组|^本组/.test(line.trim());

    if (found || isOther) {
      if (currentChunk.length > 0) {
        result.push(currentChunk.join('\n'));
      }
      currentChunk = [line];
    } else {
      currentChunk.push(line);
    }
  });

  if (currentChunk.length > 0) {
    result.push(currentChunk.join('\n'));
  }

  return result;
}

Page({

  data: {
    word: '',
    paragraphs: []
  },

  onReturn() {
    wx.navigateBack()
  },

  onLoad() {
    wx.pageScrollTo({
      duration: 0,
      scrollTop: 0
    })
  },

  onShow() {
    let word_object = app.globalData.current_word_obj
    if (this.data.word == word_object._id) {
      return
    }

    this.data.word = word_object._id
    dblog.logAction("showGPT")
    wx.showLoading({
      title: '详解加载中',
    })
    let useDict = app.globalData.dictInfo.useDict
    db.collection('details').where({
      word: this.data.word,
      wordbank_id: useDict !== '我的收藏' ? useDict : word_object.fromDict
    }).get().then(res => {
      let remoteData = res.data[0]
      let originalText = remoteData.gpt_content
      let word_list = [word_object._id, ...word_object.deris.map(deri => deri.word)];
      word_list = word_list.map(word => word.slice(0, -1)); //把word_list 中每个单词的最后一个字符去掉
      let paragraphs = grouping(originalText, word_list);  // 根据你的分段规则进行拆分
      this.setData({
        paragraphs: paragraphs
      });
      wx.hideLoading()
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage(res) {
    app.onShareAppMessage(res)
  }
})