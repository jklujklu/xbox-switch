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
    - make sure you have a working Bluetooth adapter\
      If you are running inside a VM, the PC might but not the VM. Check for a controller using `bluetoothctl show`
      or `bluetoothctl list`. Also a good indicator it the actual os reporting to not have bluetooth anymore.
    - 关闭 SDP [只有在匹配的时候需要]，将文件`/lib/systemd/system/bluetooth.service`中的对应行替换为以下内容
      to `ExecStart=/usr/lib/bluetooth/bluetoothd -C -P sap,input,avrcp`
    - 关闭输入模块 [可选，当配对无法建立时进行]\
      上述文件中将`ExecStart`一行改为`ExecStart=/usr/lib/bluetooth/bluetoothd -C -P input`
    - 重启蓝牙服务
  ```bash
    sudo systemctl daemon-reload
    sudo systemctl restart bluetooth.service
  ```

## Usage


```shell
sudo python3 run_sockets.py
```

## Thanks

[JoyControl](https://github.com/Poohl/joycontrol)

[Xbox UI](https://codepen.io/simeydotme/pen/rNepONX)
