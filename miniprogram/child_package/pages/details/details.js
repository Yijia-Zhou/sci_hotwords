var app = getApp()
const db = wx.cloud.database()
var dblog = require('../../../utils/dblog.js')

function splitTextByWords(text, words) {
  // 创建一个正则表达式，用来匹配单词列表中的任意单词
  // 使用 `i` 标志使匹配不区分大小写
  const wordPattern = '\\b(' + words.sort((a, b) => b.length - a.length).map(word => word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|') + ')\\b';
  const regex = new RegExp(wordPattern, 'gi');

  // 使用正则表达式查找所有匹配项及其位置
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      value: match[0],
      index: match.index,
    });
  }

  // 创建一个结果数组，存储匹配到的单词和剩余的部分
  const result = [];

  // 当前处理的文本起始索引
  let currentIndex = 0;

  // 处理所有匹配项
  matches.forEach(match => {
    // 添加匹配项之前的文本
    if (currentIndex < match.index) 
      result.push({
        str : text.substring(currentIndex, match.index),
        isBold : false,
      });
    
    // 添加匹配项本身
    result.push({
        str : match.value,
        isBold : true,
    });

    // 更新当前索引
    currentIndex = match.index + match.value.length;
  });

  // 添加最后一个匹配项之后的剩余文本
  if (currentIndex < text.length) {
    result.push({
      str : text.substring(currentIndex),
      isBold : false,
    });
  }

  return result;
}

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
    const isOther = /^其他|^其它|^以上|^所有|^这些|^简单|^简要|^概括|^此组|^本组/.test(line.trim());

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
      let original_word_list = word_list

      word_list = word_list.map(word => word.slice(0, -1)); //把word_list 中每个单词的最后一个字符去掉
      let descriptions = grouping(originalText, word_list);  // 根据你的分段规则进行拆分
      
      let paragraphs = [];
      descriptions.forEach(item => {
        paragraphs.push(splitTextByWords(item, original_word_list));
      })
      
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