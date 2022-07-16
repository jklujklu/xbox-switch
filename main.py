# -*- coding: utf-8 -*-
# @Time : 7/9/2022 2:53 PM
# @Author : jklujklu
# @Email : jklujklu@126.com
# @File : main.py
# @Software: PyCharm
import argparse
import asyncio
import base64
import json
import sys

import websockets

from config.xbox_one_keymap import keymap
from joycontrol.controller import Controller
from joycontrol.memory import FlashMemory
from joycontrol.nfc_tag import NFCTag, NFCTagType
from joycontrol.protocol import controller_protocol_factory
from joycontrol.server import create_hid_server
from sql import SQL
import nest_asyncio

nest_asyncio.apply()

controller_state = None

loop = asyncio.get_event_loop()


def test():
    print('{:*^50}'.format('start controller test'))
    print('1. Please open your switch config and click the \'change the Grip/Order\'')
    _ = input('[y/n]')
    while _ != 'y':
        _ = input('[y/n]')
    print('2. Please wait util your switch shows the new controller')

    # 3. 执行事件队列, 直到最晚的一个事件被处理完毕后结束
    loop.run_until_complete(asyncio.wait([connect()]))
    if controller_state is not None:
        print('paired sucess!')


async def connect():
    global controller_state
    try:
        controller = Controller.from_arg('PRO_CONTROLLER')
        spi_flash = FlashMemory()
        # prepare the the emulated controller
        factory = controller_protocol_factory(controller, spi_flash=spi_flash, reconnect='auto')
        transport, protocol = await create_hid_server(factory, reconnect_bt_addr='auto', interactive=True)
        controller_state = protocol.get_controller_state()
        await controller_state.connect()
    except Exception as e:
        print(e)
        print('bluetooth error!')
        sys.exit(-1)


def run(sql):
    async def on_receive(websocket):
        global controller_state
        async for message in websocket:
            print("got a message:{}".format(message))

            request = json.loads(message)
            mode = request['mode']
            function = request['function']
            rs = {}
            if controller_state is None:
                await connect()
            await controller_state.connect()
            if mode == 'system':
                if controller_state is not None:
                    rs = {'mode': 'system', 'function': 'connection', 'results': True}
            elif mode == 'amiibo':
                if function == 'list':
                    rows = sql.list_amiibo()
                    rs = {'mode': 'amiibo', 'function': 'list', 'results': []}
                    for row in rows:
                        rs['results'].append({'id': row[0], 'desc': row[1], 'image': row[2]})
                elif function == 'insert':
                    image = request['params']['cover']
                    desc = request['params']['desc']
                    amiibo = request['params']['bin']
                    results = sql.insert_amiibo(image, amiibo, desc)
                    rs = {'mode': 'amiibo', 'function': 'insert', 'results': results}
                elif function == 'delete':
                    amiibo_id = request['params']['id']
                    results = sql.delete_amiibo(amiibo_id)
                    rs = {'mode': 'amiibo', 'function': 'delete', 'results': results}
                elif function == 'load':
                    amiibo_id = request['params']['id']
                    amiibo = sql.select_amiibo(amiibo_id)
                    if len(amiibo) == 0:
                        continue
                    amiibo_bin = base64.b64decode(amiibo[0][3])
                    controller_state.set_nfc(
                        NFCTag(data=bytearray(amiibo_bin), tag_type=NFCTagType.AMIIBO))
                    results = True
                    rs = {'mode': 'amiibo', 'function': 'load', 'results': results}
                elif function == 'reset':
                    controller_state.set_nfc(None)
                    results = True
                    rs = {'mode': 'amiibo', 'function': 'reset', 'results': results}
            elif mode == 'click':
                content = keymap[request['params']['key']]
                controller_state.button_state.set_button(content, True if function == 'hold' else False)
            elif mode == 'stick':
                lx, ly, rx, ry = request['params']['lx'], request['params']['ly'], request['params']['rx'], \
                                 request['params']['ry']
                l_h = int(2048 + (2048 * float(lx)))
                l_v = int(2048 + (2048 * -float(ly)))
                r_v = int(2048 + (2048 * -float(ry)))
                r_h = int(2048 + (2048 * float(rx)))
                controller_state.l_stick_state.set_h((l_h if l_h > 0 else 0) if l_h < 4095 else 4095)
                controller_state.l_stick_state.set_v((l_v if l_v > 0 else 0) if l_v < 4095 else 4095)
                controller_state.r_stick_state.set_h((r_h if r_h > 0 else 0) if r_h < 4095 else 4095)
                controller_state.r_stick_state.set_v((r_v if r_v > 0 else 0) if r_v < 4095 else 4095)
            if mode == 'system' or mode == 'amiibo':
                await websocket.send(json.dumps(rs))

    server = websockets.serve(on_receive, "0.0.0.0", 8765, max_size=1_000_000_000)
    loop.run_until_complete(server)
    loop.run_forever()


def main():
    sql = SQL()

    parser = argparse.ArgumentParser(description="A method to control switch by your xbox controller")
    parser.add_argument('--keymap', help='the keyboard mapping config file', default='./config/xbox_one_keymap.py')
    parser.add_argument('--run', help='[server, test], if you haven\'t paired with switch, please choose test',
                        default='test')
    args = parser.parse_args()
    if args.run == 'test':
        test()
    else:
        run(sql)


if __name__ == '__main__':
    main()
