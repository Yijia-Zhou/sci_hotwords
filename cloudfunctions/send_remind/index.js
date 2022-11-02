const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

exports.main = async (event, context) => {
  let today = new Date().getDate()
  const dbRes = await db.collection('reminder')
  .where({remind_date: today})
  .get()
  console.log(dbRes.data)
  let result = new Array()
  for (one in dbRes.data) {
    result[one] = await cloud.openapi.subscribeMessage.send({
      "touser": dbRes.data[one]['_openid'],
      "page": 'pages/menu/menu',
      "data": {
        "thing2": { // “练习程度”
          "value": '已积跬步'
        },
        "thing6": { // “上次背诵时间”
          "value": '犹在昨日'
        },
      },
      "templateId": '8wXHxzTSdCeoHYjVcMYyGKX7DoNGHyq4zMDR9UwMr4I',
    })
    console.log(result[one])
  }
  const delRes = await db.collection('reminder')
  .where({remind_date: today})
  .remove()
  return result, delRes
}