# Introduction

这是一个实验性质的项目，目的是使用Xbox手柄控制Switch主机，目前在树莓派4B中模拟成功。

![system](./doc/system.png)

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

## Thanks

[JoyControl](https://github.com/Poohl/joycontrol)

[Xbox UI](https://codepen.io/simeydotme/pen/rNepONX)

