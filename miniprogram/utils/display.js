// 计算单词显示长度，单位：a 显示时占用 1 长度（过程中 a 等记为 14 长度，故最后除以14）
function count_display_length(word) {
    let res = 0
    for (let char in word) {
      switch(word[char].toLowerCase()) { // 用法参考 https://blog.csdn.net/tel13259437538/article/details/83314965
        case 'i':
        case 'j':
        case 'l':
        case ' ':
          res += 6
          break
        case 'f':
        case 'r':
        case 't':
        case '-':
          res += 10
          break
        case 'm':
        case 'w':
          res += 20
          break
        default:
          res += 14
      }
      if (/^[A-Z]$/.test(word[char])) {
        res += 5  // 如果是大写字母则额外+5
      }
      else if (escape(word[char]).indexOf("%u") >= 0) { // 判断方法来自 https://juejin.cn/post/6844903745583579149
        res += 10  // 如果不是英文字符则额外+10（默认当中文(长度24)处理）
      }
    }
    return res/14
}

module.exports.count_display_length = count_display_length