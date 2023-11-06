import json

class TestCaseReader(object):
    def __init__(self, filePath):
        self.filePath = filePath
    
    def loadTestCase(self):
        print(self.filePath)
        with open(self.filePath, 'r', encoding='utf-8') as f:
            str = f.read()
            self.cmdList = json.loads(str)["commands"]
            self.cmdIter = iter(self.cmdList)
    
    def getNextElement(self):
        try:
            data = json.dumps(next(self.cmdIter))
        except:
            data = None
        return data