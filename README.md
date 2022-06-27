# Introduction

这是一个实验性质的项目，目的是使用Xbox手柄控制Switch主机，目前在树莓派4B中模拟成功。

![system](./doc/system.png)

# Reqiurement

1. 树莓派，可控制蓝牙的Linux应该亦可
2. Switch
3. Xbox one手柄，xbox其他系列手柄应该亦可，但可能需要诸位自己适配按键、摇杆

## Installation

- 安装依赖
  Raspbian:

```bash
sudo apt install python3-dbus libhidapi-hidraw0 libbluetooth-dev bluez python3 python3-pip
```

```bash
sudo pip3 install aioconsole hid crc8 websockets
```

- 设置蓝牙

将`/lib/systemd/system/bluetooth.service`中的`ExecStart`命令后追加以下内容：

`-C -P sap,input,avrcp`
- 重启蓝牙服务
  ```bash
    sudo systemctl daemon-reload
    sudo systemctl restart bluetooth.service
  ```

## Usage

1. 输入`ip addr`命令查看树莓派的IP地址
2. 将`static/controler.html`中的ws地址修改为上述得到的局域网地址
3. 双击`static/controler.html`，浏览器打开页面后，连接Xbox手柄，测试按键是否正常。若各按键正常，恭喜你，离成功不远啦
4. 控制joycon手柄，将switch进入配对页面，具体步骤：`手柄 -> 更换手柄顺序`
5. 运行`sudo python3 run_sockets.py`，刷新浏览器界面，若正常，switch会显示PRO手柄已连接
6. 保持浏览器界面可见，即可通过XBox手柄控制Switch

***PS:步骤4和5的顺序，不可以相反***

***PS:Xbox控制器取得控制权后，一定不要再操作其他的手柄例如joycon，若被抢占，则需重新运行程序***

我的B站教学视频：
[Bilibili](https://www.bilibili.com/video/BV1t94y117rn/)

## Modified files
与joycontrol源代码相比，我增加了以下内容：
1. `run_sockets.py` -> websockets服务器，用于向树莓派发送手柄指令
2. `bin.py` -> 内置的24个塞尔达传说荒野之息的Amiibo文件
3. `static/*` -> XBOX手柄控制网页

此外，为了实现与Switch第一次的自动连接，对于joycontrol的源代码进行了部分修改，主要在以下内容：

`joycontrol/server.py:52` -> `if reconnect_bt_addr is None or (reconnect_bt_addr == 'auto' and not hid.get_paired_switches()):`


## Notes

joycontrol是个伟大的项目，我只是站在巨人的肩膀上，做出了一些小小的改变。

该项目本身是我出自兴趣，随手写下的，代码编写并没有考虑很多异常情况，出现bug也是正常的。

如果有大佬对这感兴趣的，可以根据joycontrol开发出适合自己的内容，我的代码仅供参考

实验性质项目，大概率不会维护。

## Thanks

[JoyControl](https://github.com/Poohl/joycontrol)

[Xbox UI](https://codepen.io/simeydotme/pen/rNepONX)

