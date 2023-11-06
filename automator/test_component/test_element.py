import json

class WxElement:
    def __init__(self, jsonObject):
        self.text = jsonObject['text']
        self.cmd  = jsonObject['command']
        self.wait = jsonObject['waitfor']

    def getElemText(self):
        return self.text

    def getElemCmd(self):
        return self.cmd
    
    def getWaitTime(self):
        return self.wait

class WxNativeElement(WxElement):
    def __init__(self, jsonObject):
        super().__init__(jsonObject)

    def name(self):
        return 'WxNativeElement'


class WxCustomElement(WxElement):
    def __init__(self, jsonObject):
        super().__init__(jsonObject)
        self.xpath = jsonObject['targetCandidates'][-1]
        self.pagePath = jsonObject['path']
        self.tag = jsonObject['tagName']
    
    def getPagePath(self):
        return '/'+self.pagePath
    
    def getXPath(self):
        return self.xpath
    
    def name(self):
        return 'WxCustomElement'
    
    def tagName(self):
        return self.tag


class WxElementFactory:
    def get(self, jsonObject):
        if jsonObject['layer'] == 'native':
            return WxNativeElement(jsonObject)
        elif jsonObject['layer'] == 'pageframe':
            return WxCustomElement(jsonObject)
        else:
            return None


