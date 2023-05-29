var app = getApp()

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
    if (!this.promises[name]) {
      wx.showLoading({ title: '获取/更新词库中，请稍候' })
      let dictionary = await this.loadDictionary(name)
      wx.hideLoading()
      return dictionary
    }
    return await this.promises[name];
  }

  // 预加载词典（用于外部调用）
  preloadDictionary(name) {
    if (!this.promises[name]) {
      setTimeout(() => {
        this.loadDictionary(name);
      }, 0);
    }
  }
  
  // 加载词典数据的方法
  loadDictionary(name) {
    this.promises[name] = new Promise((resolve, reject) => {
      console.log('Loading', name)

      // 首先检查本地存储
      var dictionary = wx.getStorageSync(name)
      if (name == "我的收藏") {
        // pass
      }
      // 如果本地存储中没有数据，调用下载词典数据的方法
      else if (!dictionary || dictionary.length == 0) {
        dictionary = this.downloadDictionary(name)
        dictionary = this.syncDictionary(dictionary)
      }
      // 如果本地存储中有数据，检查 'need_refresh' 列表，若需要刷新，调用更新词典数据的方法
      else if (wx.getStorageSync('dict_need_refresh').includes(name)) {
        dictionary = this.updateDictionary(name, dictionary)
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
    const db = wx.cloud.database()
    let reqRes = await db.collection('dictionary').doc(name).get()
    const dataTemp = reqRes.data.dictionary

    wx.setStorage({
      key: name,
      data: dataTemp
    })
    return dataTemp
  }

  syncDictionary(dictionary){
    var baseDict = wx.getStorageSync('基础词库')
    if(baseDict && baseDict.length != 0)
    {
      console.log("Sync dictionary")
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
