const Toast = {
    // 隐藏的 setTimeOut 引用
    hideTimeOut: null,
    /**
     * 初始化
     */
    init: function () {
        const toastNode = document.createElement('section');
        toastNode.innerHTML = '<span class="text">111</span>';
        toastNode.id = 'toastWaka'; // 设置id，一个页面有且仅有一个Toast
        toastNode.setAttribute('class', 'toast');   // 设置类名
        toastNode.style.top = '-50px';   // 设置隐藏
        document.body.appendChild(toastNode);
    },
    /**
     * 显示Toast
     * @param text 文本内容
     * @param duration 持续时间
     */
    show: function (text, duration) {
        // 确保上一次的 TimeOut 已被清空
        if (this.hideTimeOut) {
            clearTimeout(this.hideTimeOut);
            this.hideTimeOut = null;
            // console.error('上一次的 TimeOut 还未走完!');
            // return;
        }
        if (!text) {
            console.error('text 不能为空!');
            return;
        }
        const domToastWaka = document.getElementById('toastWaka');
        if (!domToastWaka) {
            console.error('toastWaka DOM 不存在!');
            return;
        }
        const domToastText = domToastWaka.querySelector('.text');   // 文字
        domToastText.innerHTML = text || '';
        domToastWaka.style.top = '10px';
        // 不传的话默认2s
        const that = this;
        this.hideTimeOut = setTimeout(function () {
        domToastWaka.style.top = '-50px';
            that.hideTimeOut = null;    // 置 TimeOut 引用为空
        }, duration || 2000);
    },
    /**
     * 隐藏 Toast
     */
    hide: function () {
        // 如果 TimeOut 存在
        if (this.hideTimeOut) {
            // 清空 TimeOut 引用
            clearTimeout(this.hideTimeOut);
            this.hideTimeOut = null;
        }
        const domToastWaka = document.getElementById('toastWaka');
        if (domToastWaka) {
            domToastWaka.style.top = '-50px';
        }
    }
};