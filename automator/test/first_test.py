#!/usr/bin/env python3
import minium
import time
import json
from test_component import test_case_reader
from test_component import test_element

class FirstTest(minium.MiniTest):
    def test_get_system_info(self):
        reader = test_case_reader.TestCaseReader(
            "../minitest/基础词库基本功能综合测试.json")
        reader.loadTestCase()
        jsonStr = reader.getNextElement()
        while jsonStr != None :
            print(json.dumps(jsonStr))
            elem = test_element.WxElementFactory().get(json.loads(jsonStr))
            print(type(elem))

            if(elem != None):
                if(elem.name() == 'WxCustomElement'):
                    if(elem.getElemCmd() == 'tap'):
                        page = self.app.get_current_page()
                        self.assertEqual(page.path, elem.getPagePath())
                        self.assertEqual(True, self.page.element_is_exists(elem.getXPath()))
                        pageElem = self.page.get_element(elem.getXPath())
                        
                        if(elem.tagName() == 'view' and 'picker-view' in elem.getXPath()):
                            pageElem.tap()
                            pageElem.tap()
                        elif(elem.tagName() == 'slider'):
                            pageElem.slide_to(elem.getElemValue())
                            # value = pageElem.attribute("value")[0]
                            # self.assertEqual(elem.getElemValue(), value)
                        else:
                            pageElem.tap()
                        time.sleep(2)

                    elif(elem.getElemCmd() == 'change'):
                        if(elem.tagName() == 'picker'):
                            pageElem = self.page.get_element(elem.getXPath())
                            pageElem.trigger("change", {"value": elem.getDetailValue()})
                        time.sleep(2)
                    

                elif(elem.name() == 'WxNativeElement'):
                    if(elem.getElemCmd() == 'confirmModal'):
                        self.native.handle_modal(elem.getElemText())
                    elif(elem.getElemCmd() == 'navigateLeft'):
                        self.app.navigate_back()
                    time.sleep(2)

            jsonStr = reader.getNextElement()
            