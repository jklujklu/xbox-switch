const image_preview = document.querySelector("#cover_preview");
const image_file = document.querySelector("#cover");
const bin_file = document.querySelector("#bin");
const bin_text = document.querySelector("#bin_text");
const submit_btn = document.querySelector("#upload_btn");
const desc_text = document.querySelector("#upload_description");
// ---------------------------图片上传及预览
document.querySelector('#cover_btn').onclick = () => {
    image_file.click()
}

image_file.onchange = (e) => {
    let read = new FileReader() //创建文件读取对象
    let file = e.target.files[0] //fileList name名字 size大小 type类型
    const pattern = /^image/;
    // console.info(file.type)
    if (!pattern.test(file.type)) {
        Toast.show("图片格式不正确", 3);
        return;
    }
    read.readAsDataURL(file)	//读取file信息将读取到的内容存储到result中
    //读取成功触发的函数
    read.onload = function () {
        // console.log(read.result)
        image_preview.src = read.result  //result 就是base64的缩略图地址
    }
};

// ----------------------------Bin文件上传
document.querySelector('#bin_btn').onclick = () => {
    bin_file.click()
}

bin_file.onchange = (e) => {
    let read = new FileReader() //创建文件读取对象
    let file = e.target.files[0] //fileList name名字 size大小 type类型
    console.log(file);
    let pattern = /stream$/;
    // console.info(file.type)
    if (!pattern.test(file.type)) {
        Toast.show("Amiibo格式错误");
        return;
    }
    read.readAsDataURL(file)	//读取file信息将读取到的内容存储到result中
    //读取成功触发的函数
    read.onload = function () {
        console.log(read.result)
        pattern = /base64,(.+)/
        bin_text.innerText = pattern.exec(read.result)[1];
    }
};

// ---------------------------提交按钮
submit_btn.onclick = async () => {
    const desc = desc_text.value;
    const bin = bin_text.innerText;

    let cover = image_preview.src;
    if (cover.startsWith('http')) {
        cover = await convertImgToBase64(cover);
    }
    // console.log(desc, cover, bin)
    ws.send(JSON.stringify({mode: 'amiibo', function: 'insert', params: {desc, cover, bin}}))
    mask.style.display = "none";
}

// ---------------------------遮罩及弹出层
const mask = document.getElementById("mask");

document.onclick = function (event) {
    event = event || window.event;
    //兼容获取触动事件时被传递过来的对象
    const _ = event.target ? event.target : event.srcElement;
    console.log(_)
    if (_.id === "mask") {
        mask.style.display = "none";
    }
}

document.querySelector('#plus').onclick = () => {
    mask.style.display = "block";
    //阻止冒泡
    if (event || event.stopPropagation()) {
        event.stopPropagation();
    } else {
        event.cancelBubble = true;
    }
}


function convertImgToBase64(url) {
    return new Promise(resolve => {
        let canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            img = new Image();
        img.crossOrigin = 'anonymous';//解决Canvas.toDataURL 图片跨域问题
        img.onload = () => {
            canvas.height = img.height;
            canvas.width = img.width;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            let ext = img.src.substring(img.src.lastIndexOf(".") + 1).toLowerCase();
            let dataURL = canvas.toDataURL("image/" + ext);
            resolve(dataURL);
            canvas = null;
        };
        img.src = url;
    })
}

function append_amiibo(id, desc, image) {
    const div = document.createElement('div');
    const img = document.createElement('img');
    div.classList.add('amiibo')
    img.setAttribute('src', image);
    img.setAttribute('title', desc);
    img.setAttribute('value', id);
    div.appendChild(img);

    document.querySelector('#list').prepend(div)

    div.onclick = () => {
        const msg = amiibo_click ? 'reset' : 'load';

        ws.send(JSON.stringify({mode: 'amiibo', function: msg, params: {id}}));
        amiibo_click = !amiibo_click;
        if (amiibo_click) {
            div.classList.add('active')
        } else {
            document.querySelector('.active').classList.remove('active')
        }
    }
    div.oncontextmenu = function (e) {
        e.preventDefault();
        // 执行代码块
        ws.send(JSON.stringify({mode: 'amiibo', function: 'delete', params: {id}}));
    }
}