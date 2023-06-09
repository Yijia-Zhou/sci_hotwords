require('./wx.js')
const { DictionaryLoader } = require('../miniprogram/utils/requestDict');  // 导入你的模块

// 创建 mock 函数
wx.getStorageSync = jest.fn();
wx.setStorage = jest.fn();
wx.cloud = {
  database: jest.fn().mockReturnThis(),
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  get: jest.fn().mockResolvedValue({ data: { dictionary: [] } }),
};

describe('DictionaryLoader', () => {
  let dictionaryLoader;

  beforeEach(() => {
    dictionaryLoader = new DictionaryLoader();
  });

  test('getDictionary returns a Promise', () => {
    const result = dictionaryLoader.getDictionary('test');
    expect(result).toBeInstanceOf(Promise);
  });

  test('getDictionarySync returns a Array', async () => {
    const result = await dictionaryLoader.getDictionarySync('test');
    expect(result).toBeInstanceOf(Array);
  });

  test('loadDictionary returns a Promise', () => {
    const result = dictionaryLoader.loadDictionary('test');
    expect(result).toBeInstanceOf(Promise);
  });

  // 更多的测试...
});
