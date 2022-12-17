const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  // let today = new Date().getDate()
  let now_ms = new Date().getTime()
  const dbRes = await db.collection('reminder')
  .where({ //_.gt(30).and(_.lt(70))
    remind_time_ms: _.gt(now_ms-1000*60*6).and(_.lt(now_ms+1)) // 对{设定提醒时间：6分钟前到现在}的记录进行逐一发送
  })
  .get()
  console.log(dbRes.data)
  let result = new Array()
  let doc_ids = new Array()
  for (one in dbRes.data) {
    result[one] = await cloud.openapi.subscribeMessage.send({
      "touser": dbRes.data[one]['_openid'],
      "page": 'pages/menu/menu',
      "data": {
        "thing1": { // 昨日情况
          "value": '昨日的征程已在身后'
        },
        "thing2": { // 今日目标
          "value": '今天的路途就从现在开始'
        },
      },
      "templateId": 'fIbeAXEbSJXGLeVhkuTxth5JrxvXw3sweb0NGd8a83c',

      // "data": {
      //   "thing2": { // “练习程度”
      //     "value": '已积跬步'
      //   },
      //   "thing6": { // “上次背诵时间”
      //     "value": '犹在昨日'
      //   },
      // },
      // "templateId": '8wXHxzTSdCeoHYjVcMYyGKX7DoNGHyq4zMDR9UwMr4I',
    })
    doc_ids[one] = dbRes.data[one]._id
    console.log(result[one])
  }
  if (doc_ids.length>0) {
    let delRes = await db.collection('reminder')
    .where({_id: _.in(doc_ids)})
    .remove()
    return result, delRes
  }
  return result
}