import asyncio
import websockets
import logging
import joycontrol.debug as debug
from joycontrol import logging_default as log, utils
from joycontrol.command_line_interface import ControllerCLI
from joycontrol.controller import Controller
from joycontrol.controller_state import ControllerState, button_push, button_press, button_release
from joycontrol.memory import FlashMemory
from joycontrol.protocol import controller_protocol_factory
from joycontrol.server import create_hid_server
from joycontrol.nfc_tag import NFCTag, NFCTagType
from bin import *

logger = logging.getLogger(__name__)
# 按键
btns = ['a', 'b', 'x', 'y', 'up', 'down', 'left', 'right', 'lb', 'rb', 'lt', 'rt', 'map', 'menu', 'lstick', 'rstick',
        'xbox']
# 摇杆轴
axis = ['lx', 'ly', 'rx', 'ry']

controller_state = None

# 滑动窗口形式，保存摇杆状态
axis_state = []


async def connect():
    global controller_state
    controller = Controller.from_arg('PRO_CONTROLLER')
    spi_flash = FlashMemory()
    # prepare the the emulated controller
    factory = controller_protocol_factory(controller, spi_flash=spi_flash, reconnect='auto')
    ctl_psm, itr_psm = 17, 19
    transport, protocol = await create_hid_server(factory, reconnect_bt_addr='auto',
                                                  ctl_psm=ctl_psm,
                                                  itr_psm=itr_psm,
                                                  interactive=True)
    controller_state = protocol.get_controller_state()


async def on_receive(websocket):
    global controller_state
    async for message in websocket:
        # print("got a message:{}".format(message))
        if message == 'connect':
            if controller_state is None:
                await connect()
            if controller_state is not None:
                await websocket.send('connected')
        else:
            command, content = message.split('_')
            if controller_state is None:
                await connect()
            await controller_state.connect()
            if command == 'hold' or command == 'release':
                if content in btns:
                    if content == 'lb':
                        content = 'l'
                    elif content == 'rb':
                        content = 'r'
                    elif content == 'lt':
                        content = 'zl'
                    elif content == 'rt':
                        content = 'zr'
                    elif content == 'map':
                        content = 'minus'
                    elif content == 'menu':
                        content = 'plus'
                    elif content == 'lstick':
                        content = 'l_stick'
                    elif content == 'rstick':
                        content = 'r_stick'
                    elif content == 'xbox':
                        content = 'home'
                    controller_state.button_state.set_button(content, True if command == 'hold' else False)
            elif command == 'stick':
                # print(content)
                if content in axis_state:
                    continue
                else:
                    axis_state.insert(0, content)
                    if len(content) > 100:
                        axis_state.pop()
                    lx, ly, rx, ry = content.split('/')
                    l_h = int(2048 + (2048 * float(lx)))
                    l_v = int(2048 + (2048 * -float(ly)))
                    r_v = int(2048 + (2048 * -float(ry)))
                    r_h = int(2048 + (2048 * float(rx)))
                    controller_state.l_stick_state.set_h((l_h if l_h > 0 else 0) if l_h < 4095 else 4095)
                    controller_state.l_stick_state.set_v((l_v if l_v > 0 else 0) if l_v < 4095 else 4095)
                    controller_state.r_stick_state.set_h((r_h if r_h > 0 else 0) if r_h < 4095 else 4095)
                    controller_state.r_stick_state.set_v((r_v if r_v > 0 else 0) if r_v < 4095 else 4095)
            elif command == 'amiibo':
                if content == 'reset':
                    controller_state.set_nfc(None)
                    await websocket.send('reset')
                else:
                    controller_state.set_nfc(NFCTag(data=bytearray(eval(f'bin_{content}')), tag_type=NFCTagType.AMIIBO))
                    await websocket.send('amiibo')


async def main():
    # start a websocket server
    async with websockets.serve(on_receive, "0.0.0.0", 8765):
        logger.info('websockets server is running: ws://0.0.00:8765')
        await asyncio.Future()  # run forever


if __name__ == '__main__':
    asyncio.run(main())
