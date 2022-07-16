# Introduction

这是一个实验性质的项目，目的是使用Xbox手柄控制Switch主机，目前在树莓派4B中模拟成功。

![system](./doc/system.png)

# Requirements

1. 树莓派，可控制蓝牙的Linux应该亦可
2. Switch
3. Xbox one手柄，xbox其他系列手柄应该亦可，但可能需要诸位自己适配按键、摇杆

**PS: Windows + Linux虚拟机方案最好使用外置的USB蓝牙，板载的蓝牙经测试，无法在虚拟机中使用**

**PS2: 确保Linux的蓝牙模块可以被搜索，可使用`hcitool scan`命令查看**

## Installation

- 安装依赖
  
Raspbian:

```bash
sudo apt install python3-dbus libhidapi-hidraw0 libbluetooth-dev bluez python3 python3-pip
```

```bash
sudo pip3 install aioconsole hid crc8 websockets nest_asyncio
```

- 设置蓝牙

将`/lib/systemd/system/bluetooth.service`中的`ExecStart`命令后追加以下内容：

`-C -P sap,input,avrcp`

- 重启蓝牙服务
  ```bash
    sudo systemctl daemon-reload
    sudo systemctl restart bluetooth.service
  ```

**蓝牙修改后记得一定要重启蓝牙服务!**

## Usage

1. 输入`ip addr`命令查看树莓派的IP地址
2. 将`static/controler.html`中的ws地址修改为上述得到的局域网地址
3. 双击`static/controler.html`，浏览器打开页面后，连接Xbox手柄，测试按键是否正常。若各按键正常，恭喜你，离成功不远啦
4. 第一次运行请使用以下命令进行测试配对：`sudo python3 main.py --run test`，若之前已配对过，可跳过本步骤
5. 运行`sudo python3 main.py`，刷新浏览器界面，若正常，switch会显示PRO手柄已连接
6. 保持浏览器界面可见，即可通过XBox手柄控制Switch

***若步骤4出现问题，那么很遗憾，你大概率无法连接Switch，请寻找另外的解决方案***

***PS:Xbox控制器取得控制权后，一定不要再操作其他的手柄例如joycon，若被抢占，则需重新运行程序***

我的B站教学视频：
[Bilibili](https://www.bilibili.com/video/BV1t94y117rn/)

## Modified files

与joycontrol源代码相比，我增加了以下内容：

1. `main.py` -> 主程序
2. `config/xbox_one_keymap.py.py` -> 按键映射关系
3. `static/*` -> XBOX手柄控制网页
4. `sql.py` -> Sqlite数据库，用于存储amiibo信息

此外，为了实现与Switch第一次的自动连接，对于joycontrol的源代码进行了部分修改，主要在以下内容：

`joycontrol/server.py:52`
-> `if reconnect_bt_addr is None or (reconnect_bt_addr == 'auto' and not hid.get_paired_switches()):`

## Update

**v 0.1**
> 1. 修改启动方式，增加测试
> 2. 增加本地存储，可自主添加Amiibo

## Problems
### 如何清除Switch配对记录

1. 终端中输入以下命令:
```bash
bluetoothctl remove $(bluetoothctl paired-devices | grep -F "Nintendo Switch" | grep -oE "([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}")
```
2. 重启蓝牙服务
```bash
    sudo systemctl daemon-reload
    sudo systemctl restart bluetooth.service
```
3. Switch本地删除
```shell
设备 -> 手柄与感应 -> 断开与手柄的连接
```

### 配对显示refuses to stay connected
该问题大概率是网卡不兼容问题导致，可以尝试以下方法：
[https://github.com/Poohl/joycontrol/issues/4](https://github.com/Poohl/joycontrol/issues/4)

## Notes

joycontrol是个伟大的项目，我只是站在巨人的肩膀上，做出了一些小小的改变。

该项目本身是我出自兴趣，随手写下的，代码编写并没有考虑很多异常情况，出现bug也是正常的。

如果有大佬对这感兴趣的，可以根据joycontrol开发出适合自己的内容，我的代码仅供参考

实验性质项目，大概率不会维护。

## Thanks

[JoyControl](https://github.com/Poohl/joycontrol)

[Xbox UI](https://codepen.io/simeydotme/pen/rNepONX)

