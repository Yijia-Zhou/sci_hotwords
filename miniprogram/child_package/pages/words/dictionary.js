class Dictionary {
    constructor(dict, idx, filtername) {
        this.dictionary = dict
        this.index = idx
        this.filter = filtername
    }

    updateUseDict(useDict) {
      this.useDict = useDict
    }

    getUseDict(useDict) {
      return useDict
    }

    updateFilter(filter) {
        if(filter == 'no_high_school')
            this.filter = 'no_high_school'
        else
            this.filter = 'none'
    }

    getFilter(filter) {
        return filter
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
        this.index++
        while(!this.isAllDone()) {
            if(this.checkIfDisplay()){
                return this.dictionary[this.index]
            }
            this.index++
        }
        return null
    }

    isWordUntraverse() {
        return !this.dictionary[this.index][this.chooseStatus]
    }

    isWordInfilter() {
        return !this.dictionary[this.index].high_school
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

    checkIfDisplay() {
        let res = this.isWordUntraverse()
        if(this.filter){
            res = res && this.isWordInfilter()
        }
        return res
    }

    isAllDone() {
        return this.index >= this.dictionary.length
    }

    resetDictionary() {
        for (var w in this.dictionary) {
            this.dictionary[w][this.chooseStatus] = false
        }
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
        this.dictionary[this.index][this.chooseStatus] = true
    }

    isDictionaryEmpty() {
        return this.dictionary.length == 0
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

    removeFavorWord() {
        const index2del = (element) => {
            return element._id == this.dictionary[this.index]._id
        }
        this.dictionary.splice(this.dictionary.findIndex(index2del), 1)
    }

    addFavorWord() {
        this.dictionary.splice(this.index, 0)
    }

    getFavorDict() {
        return this.dictionary
    }
};