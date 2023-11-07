#!/usr/bin/env python3
import minium
import time
import json
from test_component import test_case_reader
from test_component import test_element

class FirstTest(minium.MiniTest):
    def test_get_system_info(self):
        reader = test_case_reader.TestCaseReader(
            "../minitest/利用收藏词库进行各种“点到底”.json")
        reader.loadTestCase()
        jsonStr = reader.getNextElement()
        while jsonStr != None :
            print(json.dumps(jsonStr))
            elem = test_element.WxElementFactory().get(json.loads(jsonStr))
            print(type(elem))

            if(elem != None):
                if(elem.name() == 'WxCustomElement'):
                    page = self.app.get_current_page()
                    self.assertEqual(page.path, elem.getPagePath())
                    self.assertEqual(True, self.page.element_is_exists(elem.getXPath()))
                    pageElem = self.page.get_element(elem.getXPath())
                    # elem.getElemCmd
                    pageElem.tap()
                    time.sleep(2)
                elif(elem.name() == 'WxNativeElement'):
                    if(elem.getElemCmd() == 'confirmModal'):
                        self.native.handle_modal(elem.getElemText())
                    elif(elem.getElemCmd() == 'navigateLeft'):
                        self.app.navigate_back()
                    time.sleep(2)

            jsonStr = reader.getNextElement()
            