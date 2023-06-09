require('./wx.js')
const dblog = require('./../miniprogram/utils/dblog');

test('logAction and report', () => {
  dblog.logAction("onQuery")
  dblog.reportUserLog()
  console.log(testDB[0].data.deviceInfo.model)
  expect(testDB[0].data.deviceInfo.model).toBe('iphone');
});