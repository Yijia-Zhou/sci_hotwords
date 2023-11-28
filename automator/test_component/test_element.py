import json
import re

class WxElement:
    def __init__(self, jsonObject):
        if('text' in jsonObject):
            self.text = jsonObject['text']
        if('value' in jsonObject):
            self.value = jsonObject['value']
        if('eventData' in jsonObject and 'detail' in jsonObject['eventData'] and 'value' in jsonObject['eventData']['detail']):
            self.detailValue = jsonObject['eventData']['detail']['value']
        self.cmd  = jsonObject['command']
        self.wait = jsonObject['waitfor']

    def getElemText(self):
        return self.text
    
    def getElemValue(self):
        return self.value
    
    def getDetailValue(self):
        return self.detailValue

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
        strRegex = re.compile(r"/text.*")
        subStr = strRegex.sub("", self.xpath)
        return subStr
    
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


