#!/usr/bin/env python3
import minium
class FirstTest(minium.MiniTest):
    def test_get_system_info(self):
        sys_info = self.mini.get_system_info()
        self.assertIn("SDKVersion", sys_info)