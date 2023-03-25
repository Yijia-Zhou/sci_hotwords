class Dictionary {
    constructor(dict, idx, filtername) {
        this.dictionary = dict
        this.index = idx
        this.filter = filtername
    }

    updateUseDict(useDict) {
      this.useDict = useDict
    }

    getUseDict() {
      return this.useDict
    }

    updateFilter(filter) {
        if(filter == 'no_high_school')
            this.filter = 'no_high_school'
        else
            this.filter = 'none'
    }

    getFilter() {
        return this.filter
    }

    updateUseMode(useMode) {
        let useModeMap = {'识记模式': 'learnt', '检验模式': 'tested'}
        this.useMode = useMode
        this.chooseStatus = useModeMap[useMode]
    }

    getUseMode() {
        return this.useMode
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
                return this.dictionary[this.index]
            }
            this.index++
        }
        return null
    }

    isWordUntraverse(word) {
        return !word[this.chooseStatus]
    }

    isWordInfilter(word) {
        return !word.high_school
    }

    isCurrentWordInfilter() {
        return this.isWordInfilter(this.dictionary[this.index])
    }

    selectFirstWord() {
        console.log(this.dictionary)
        for (var w in this.dictionary) {
            this.index = w
            if(this.checkIfDisplay(this.dictionary[w])) {
                return this.dictionary[w]
            }
        }
        return null
    }

    checkIfDisplay(word) {
        let res = this.isWordUntraverse(word)
        if(this.filter == 'no_high_school'){
            res = res && this.isWordInfilter(word) // diff_Todo: difficulty_level 低于 diff_threshold 的单词将不予显示
        }
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

    markWord() {
      console.log(this.dictionary[this.index])
        this.dictionary[this.index][this.chooseStatus] = true
        if(this.chooseStatus == 'tested') 
            this.dictionary[this.index]['learnt'] = true
    }

    isDictionaryEmpty() {
        return this.dictionary.length == 0
    }

    commitData(){

    }
};

export class NormalDictionary extends Dictionary {
    constructor(dictionary) {
        super(dictionary, 0, 'none')
        this.favorList = new Array()
    }

    isCurrentWordInFavored(word) {
        for (var w in this.favorList) {
            if(this.favorList[w]._id == this.getCurrentWord()._id)
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
        temp.from = this.useDict
        this.favorList.push({...temp})
    }

    removeFavorWord() {
        const index2del = (element) => {
            return element._id == this.dictionary[this.index]._id
                               && element.from == this.useDict
        }
        this.favorList.splice(this.favorList.findIndex(index2del), 1)
    }

    markWord() {
        this.dictionary[this.index][this.chooseStatus] = true
        this.markedNum++
    }

    showCoreWordNum() {
        return true
    }

    getCoreWordNum() {
        return (Math.floor(this.markedNum / 100) + 1)
    }

    isCoreNumUpdated() {
        if(this.chooseStatus == 'learnt')
        {
            return this.markedNum % 100 == 0
        }
        else
        {
            if(this.dictionary[this.index]['learnt'] == true)
            {
                let nextWord = this.getNextWord()
                if(nextWord && !nextWord.hasOwnProperty('learnt'))
                {
                    return true
                }
            }
        }
        return false
    }

    initCoreWordNum() {
        this.markedNum = this.dictionary.filter(w => w[this.chooseStatus] == true).length;
    }
};

export class FavorDictionary extends Dictionary {
    constructor(dictionary) {
        super(dictionary, 0, 'none')
    }

    isCurrentWordInFavored(word) {
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
          return element[this.chooseStatus] == false && !element.hasOwnProperty('toBeRemoved')
        }
        let idx = this.dictionary.findIndex(indexNoFilter)
        if(idx == -1) 
            return true 
        else
            this.index = idx
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

    showCoreWordNum(){
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
};