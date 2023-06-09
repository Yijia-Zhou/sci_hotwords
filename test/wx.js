global.app = {
    globalData: {
        dictInfo:  {
            "dictNames": {
                "生命科学": {
                  "基础词库": {
                      "paper_count": 1217564
                  },
                  "分子生物学": {
                      "paper_count": 75205
                  },
                  "神经&认知": {
                      "paper_count": 51713
                  },
                  "生信&计算": {
                      "paper_count": 18965
                  }
                }
              },
              "marker": 8,
              "modes": [
                "识记模式",
                "检验模式"
              ],
              "daily_target": 30,
              "useMode": "识记模式",
              "useDict": "生信&计算"
        }
    }

}

global.getApp = function () {
    return global.app
};

global.testDB = []

let mockAdd = jest.fn(function (log) {
    global.testDB.push(log)
})

let mockCollection = jest.fn(function (db) {
    return {
        add: mockAdd
    }
})

let mockDataBase = jest.fn(function () {
    return {
        collection: mockCollection
    }
})

let mockDeviceInfo = jest.fn(()=>{
    return {model: "iphone"}
})

global.wx = {
    cloud: {
        database: mockDataBase,
    },
    getDeviceInfo: mockDeviceInfo
}
