class Dictionary {
    constructor(dict, idx) {
        this.dictionary = dict
        this.index = idx
    }

    updateUseDict(useDict) {
        this.useDict = useDict
    }

    updateUseCluster(useCluster) {
        this.useCluster = useCluster
    }

    getUseDict() {
        return this.useDict
    }

    getUseCluster() {
        return this.useCluster
    }

    updateUseMode(useMode) {
        let useModeMap = {'识记模式': 'learnt', '检验模式': 'tested'}
        this.useMode = useMode
        this.chooseStatus = useModeMap[useMode]
    }

    getUseMode() {
        return this.useMode
    }

    isWordUntraverse(word) {
        return !word.hasOwnProperty(this.chooseStatus) || !word[this.chooseStatus]
    }

    getNextWord() {
        let idx = this.index
        let retWord = this.jumpToNextWord()
        this.index = idx
        return retWord
    }

    jumpToNextWord() {
        this.index++
        while(!this.isAllDone()) {
            if(this.checkIfDisplay(this.dictionary[this.index])){
                console.log("jumpToNextWord - index:", this.index)
                return this.dictionary[this.index]
            }
            this.index++
        }
        return null
    }

    selectFirstWord() {
        for (var w in this.dictionary) {
            this.index = w
            if(this.checkIfDisplay(this.dictionary[w])) {
                return this.dictionary[w]
            }
        }
        return null
    }

    resetDictionary() {
        for (var w in this.dictionary) {
            this.dictionary[w][this.chooseStatus] = false
        }
        if(this.chooseStatus == 'tested')
        {
          for (var w in this.dictionary) {
            this.dictionary[w]['learnt'] = false
          }
        }
        this.selectFirstWord()
    }

    getDictionary() {
        return this.dictionary
    }

    getCurrentWord() {
        return this.dictionary[this.index]
    }

    updateDictionary(dictionary) {
        this.dictionary = dictionary
    }

    markWord(mark) {
      // mark 为一个Boolean值，为是否掌握
      console.log(this.dictionary[this.index])
      this.dictionary[this.index][this.chooseStatus] = mark
      if(mark && this.chooseStatus == 'tested') // 如果识记模式中标记了掌握那也回头标一些learnt
        this.dictionary[this.index]['learnt'] = true
    }

    isDictionaryEmpty() {
        return this.dictionary.length == 0
    }

    commitData(){}

    isFilterEnabled() {
        return false
    }
};

export class NormalDictionary extends Dictionary {
    constructor(dictionary) {
        super(dictionary, 0)
        this.favorList = new Array()
        this.filter = 'none'
        this.difficultyFilter = 0
    }

    isFilterEnabled() {
        return true
    }

    updateFilter(filter) {
        if(filter == 'no_high_school')
            this.filter = 'no_high_school'
        else
            this.filter = 'none'
    }

    updateDifficultyFilter(difficultyFilter) {
        this.difficultyFilter = difficultyFilter
    }

    checkIfDisplay(word) {
        let res = this.isWordUntraverse(word)
        if(this.filter == 'no_high_school'){
            res = res && this.isWordInfilter(word)
        }
        res = res && this.isWordInDiffcultyFilter(word)
        return res
    }

    isAllDone() {
        if(this.index >= this.dictionary.length)
        {
            if(this.filter == 'no_high_school')
            {
                const indexFilter = (element) => {
                    return element[this.chooseStatus] == false
                        && element.high_school == false
                        && element.difficulty_level > this.difficultyFilter
                }
                let idx = this.dictionary.findIndex(indexFilter)
                if(idx == -1) 
                    return true 
                else
                    this.index = idx
            }
            else
            {
                const indexNoFilter = (element) => {
                    return element[this.chooseStatus] == false
                        && element.difficulty_level > this.difficultyFilter
                }
                let idx = this.dictionary.findIndex(indexNoFilter)
                if(idx == -1) 
                    return true 
                else
                    this.index = idx
            }
        }
        return false
    }

    isWordInfilter(word) {
        return !word.hasOwnProperty('high_school') || !word.high_school
    }

    isWordInDiffcultyFilter(word) {
        return word.difficulty_level > this.difficultyFilter
    }

    isWordInFavored(word) {
        for (var w in this.favorList) {
            if(this.favorList[w]._id == word._id)
            {
                return true
            }
        }
        return false
    }

    updateFavorList(data) {
        this.favorList = data
    }

    getFavorDict() {
        return this.favorList
    }

    addFavorWord() {
        let temp = {...this.dictionary[this.index]}
        this.updateWordFrom(temp)
        this.favorList.push({...temp})
    }

    removeFavorWord() {
        const index2del = (element) => {
            return element._id == this.dictionary[this.index]._id
                && element.fromCluster == this.useCluster
                && element.fromDict == this.useDict 
        }
        this.favorList.splice(this.favorList.findIndex(index2del), 1)
    }

    markWord(mark) {
        super.markWord(mark)
        this.markedNum++
    }

    needTracer() {
        return true
    }

    getMarkedWordNum() {
        return this.markedNum
    }


    initMarkedWordNum() {
        this.markedNum = this.dictionary.filter(w => w[this.chooseStatus] == true).length;
        console.log("markednum", this.markedNum)
    }

    updateWordFrom(word)
    {
        word.fromCluster = this.useCluster
        word.fromDict = this.useDict
    }

    resetDictionary()
    {
        super.resetDictionary()
        this.markedNum = 0
    }

    isCurrentWordLeant()
    {
        return this.dictionary[this.index]['learnt'] == true
    }

    isNextWordLeant()
    {
        console.log('nextword:', this.getNextWord())
        return this.getNextWord()['learnt'] == true
    }
};

export class FavorDictionary extends Dictionary {
    constructor(dictionary) {
        super(dictionary, 0)
    }

    isWordInFavored(word) {
        for (var w in this.dictionary) {
            if(this.dictionary[w]._id == word._id)
            {
                return true
            }
        }
        return false
    }

    checkIfDisplay(word) {
        let res = this.isWordUntraverse(word)
        res = res && !word.hasOwnProperty('toBeRemoved')
        return res
    }

    isAllDone() {
      if(this.index >= this.dictionary.length)
      {
        const indexNoFilter = (element) => {
          return element[this.chooseStatus] != true && !element.hasOwnProperty('toBeRemoved')
        }
        let idx = this.dictionary.findIndex(indexNoFilter)
        if(idx == -1) 
            return true 
        else {
            wx.showModal({
                showCancel: false,
                title: '本词典到底啦\r\n重新翻出尚未掌握的'
            })
            this.index = idx
        }
      }
      return false
    }

    commitData(){
        for (let i = this.dictionary.length - 1; i >= 0; i--) {
            if (this.dictionary[i].hasOwnProperty('toBeRemoved')) {
                this.dictionary.splice(i, 1);
            }
        }
        console.log(this.dictionary)
    }

    removeFavorWord() {
        this.dictionary[this.index].toBeRemoved = true
    }

    addFavorWord() {
        delete this.dictionary[this.index].toBeRemoved
    }

    getFavorDict() {
        return this.dictionary
    }

    needTracer(){
        return false
    }

    isDictionaryEmpty() {
      if(this.dictionary.length == 0)
      {
        return true
      }
      for (var w in this.dictionary) {
        if(!this.dictionary[w].hasOwnProperty('toBeRemoved'))
        {
            return false
        }
      }
      return true
    }

    updateWordFrom(word)
    {
    }
};