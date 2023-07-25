var app = getApp()
var dblog = require('./dblog.js')

class DictionaryLoader {
  constructor() {
    if (DictionaryLoader.instance) {
      return DictionaryLoader.instance;
    }
    DictionaryLoader.instance = this;
    this.promises = {};
  }

  // 获取词典数据接口(返回promise)
  getDictionary(name) {
    if (!this.promises[name]) {
      return this.loadDictionary(name);
    }
    return this.promises[name];
  }

  // 获取词典数据接口(同步版本，直接返回词典数据)
  async getDictionarySync(name) {
    console.log("getDictionarySync -", name)
    wx.showLoading({ title: '获取/更新词库中，请稍候' })
    if (!this.promises[name]) {
      let dictionary = await this.loadDictionary(name)
      wx.hideLoading()
      return await dictionary
    }
    let dictionary = await this.promises[name]
    wx.hideLoading()
    return await dictionary
  }

  // 预加载词典（用于外部调用）
  preloadDictionary(name) {
    if (!this.promises[name]) {
      setTimeout(() => {
        this.loadDictionary(name);
      }, 0);
    }
  }

  // 删除对应某个词典的promise（用于外部调用[当词典数据已知发生改变时]）
  removeDictionary(name) {
    delete this.promises[name];
  }
  
  // 加载词典数据的方法
  loadDictionary(name) {
    this.promises[name] = new Promise(async (resolve, reject) => {
      console.log('Loading', name)

      // 首先检查本地存储
      var dictionary = wx.getStorageSync(name)

      if (name != "我的收藏") {
        // 如果本地存储中没有数据，调用下载词典数据的方法
        if (!dictionary || dictionary.length == 0) {
          dictionary = await this.downloadDictionary(name)
        }
        // 如果本地存储中有数据，检查 'need_refresh' 列表，若需要刷新，调用更新词典数据的方法
        else if (wx.getStorageSync('dict_need_refresh').includes(name)) {
          dictionary = await this.updateDictionary(name, dictionary)
        }
        // 如果当前词库没有任何学习记录，则同步基础词库的学习记录
        if (!name.includes('基础') && dictionary.every(item => !item.learnt && !item.tested)) {
          dictionary = this.syncDictionary(dictionary)
        }
      }

      resolve(dictionary);
    });
    return this.promises[name];
  }

  // 更新词典数据的方法
  async updateDictionary(name, dictionary){
    const db = wx.cloud.database()
    let reqRes = await db.collection('dictionary').doc(name).get()
    const dataTemp = reqRes.data.dictionary
    console.log('更新词库中', dataTemp)
    for (var i in dictionary) {
      let theOldItem = dictionary[i]
      let itemIndex = dataTemp.findIndex((item) => item._id.toLowerCase().trim() === theOldItem._id.toLowerCase().trim())
      if (itemIndex != -1) {
        dataTemp[itemIndex].learnt = theOldItem.learnt
        dataTemp[itemIndex].tested = theOldItem.tested
      }
      // 本地学习过程中在 dictionary 内添加的属性塞进更新过的词典里
    }
    wx.setStorage({
      key: name,
      data: dataTemp
    })
    console.log('更新词库完毕~')
    let dict_need_refresh = wx.getStorageSync('dict_need_refresh')
    dict_need_refresh.splice(dict_need_refresh.indexOf(app.globalData.dictInfo.name), 1)
    wx.setStorage({
      key: 'dict_need_refresh',
      data: dict_need_refresh
    })
    return dataTemp
  }

  // 下载词典数据的方法
  async downloadDictionary(name) {
    dblog.logAction('downloadDictionary', name)
    const db = wx.cloud.database()
    let reqRes = await db.collection('dictionary').doc(name).get()
    const dataTemp = await reqRes.data.dictionary

    wx.setStorage({
      key: name,
      data: dataTemp
    })
    return dataTemp
  }

  async syncDictionary(dictionary){
    console.log("Sync dictionary")
    let baseDict = await this.getDictionary('基础词库')
    if(baseDict && baseDict.length != 0)
    {
      for (var i in dictionary) {
        let syncItem = dictionary[i]
        let itemIndex = baseDict.findIndex((item) => item._id.toLowerCase().trim() === syncItem._id.toLowerCase().trim())
        if (itemIndex != -1) {
          if(baseDict[itemIndex].hasOwnProperty('learnt')){
            syncItem.learnt = baseDict[itemIndex].learnt
          }
          if(baseDict[itemIndex].hasOwnProperty('tested')){
            syncItem.tested = baseDict[itemIndex].tested
          }
        }
      }
    }
    return dictionary
  }
}

module.exports.DictionaryLoader = DictionaryLoader
