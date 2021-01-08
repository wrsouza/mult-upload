require('./assets/scss/main.scss')
import empty from './assets/img/empty.png'
import axios from 'axios'
const sha1 = require('js-sha1');
const urlApi = 'http://image-upload.test/upload'

let listFiles = []
let width = 10.2 // (cm)
let height = 15.2 // (cm)
let thumb = 400
let dpi = 300
let crop = true
let columns = [
  { total: 2, min: 400 },
  { total: 3, min: 800 },
  { total: 4, min: 1100 },
  { total: 5, min: 1400 }
]
let max_width, max_height

let btSelect = document.getElementById('btSelect')
let btAdd = document.getElementById('btAdd')
let btRemove = document.getElementById('btRemove')
let btEnviar = document.getElementById('btEnviar')
let selectUpload = document.getElementById('selectUpload')
let displayList = document.getElementById('displayList')

const init = () => {
  calc()
  resize()
  btSelect.addEventListener('click', selectFiles)
  btAdd.addEventListener('click', selectFiles)
  btAll.addEventListener('click', selAllElement)
  btRemove.addEventListener('click', removeElement)
  btEnviar.addEventListener('click', upload)
  window.addEventListener('resize', resize)
}

const calc = () => {
  let w = (width > height) ? width : height
  let h = (width > height) ? height : width
  let inch = 2.54
  let pixel_width = Math.round((w/inch)*dpi)
  let pixel_height = Math.round((h/inch)*dpi)
  let ratio = (thumb/pixel_width)
  max_width = Math.round(pixel_width * ratio)
  max_height = Math.round(pixel_height * ratio)
}

const getColumn = (width) => {
  let total = 1
  columns.forEach((item) => {
    if (width >= item.min) {
      total = item.total
    }
  })
  return total
}

const resize = () => {
  let win_width = window.innerWidth - 30
  let col_width = Math.floor(win_width/getColumn(win_width))
  let w = col_width
  let h = Math.round(max_height * (col_width/max_width))
  let total = displayList.children.length
  for (let i=0; i<total; i++) {
    displayList.childNodes[i].style.width = w + 'px'
    displayList.childNodes[i].style.height = h + 'px'
  }
}

const selectFiles = () => {
  let input = document.createElement('input')
  input.type = "file"
  input.multiple = true
  input.accept = ".jpg, .jpeg, .png|images/*"
  input.addEventListener('change', selectedFiles)
  input.click()
}

const selectedFiles = (e) => {
  for (var i=0; i<e.target.files.length; i++) {
    if (e.target.files[i].type == "image/jpeg" || e.target.files[i].type == "image/png") {
      if (!checkFileExists(e.target.files[i])) {
        let extension = e.target.files[i].name.split('.').pop()
        let timestamp = Math.floor(new Date().getTime()/1000)
        let name = sha1(e.target.files[i].name + timestamp.toString()) + '.' + extension.toLowerCase()
        listFiles.push({
          status: 'WAITING',
          porcentage: 0,
          name: name,
          file: e.target.files[i],
          select: false
        })
        insertElement()
      }
    }
  }
  if (!selectUpload.classList.contains("openned")) {
    selectUpload.classList.add('openned')
  }
  listFiles.forEach((item, idx) => {
    if (item.status == 'WAITING') {
      listFiles[idx].status = 'LOADING'
      read(idx)
    }
  })
  resize()
}

const insertElement = () => {
  let li = document.createElement('li')
      li.addEventListener('click', selElement)
  let container = document.createElement('div')
      container.classList.add('container')
  let image = new Image()
      image.src = empty
  let progress = document.createElement('div')
      progress.classList.add('progress')
  let progressbar = document.createElement('div')
      progressbar.classList.add('progress-bar')
  let progresstext = document.createElement('span')
      progresstext.classList.add('progress-text')
      progresstext.innerHTML = '0%'

  progress.appendChild(progressbar)
  progress.appendChild(progresstext)

  container.appendChild(image)
  container.appendChild(progress)

  li.appendChild(container)
  displayList.appendChild(li)
}

const checkFileExists = (file) => {
  var check = false
  listFiles.forEach((item) => {
    if (item.file.name === file.name && item.file.size === file.size) {
      check = true
    }
  })
  return check
}

const read = (idx) => {
  var li = displayList.childNodes[idx]
  var container = li.childNodes[0]
  var progress = container.childNodes[1]
  var progressbar = progress.childNodes[0]
  var progresstext = progress.childNodes[1]

  var fileReader = new FileReader()
  fileReader.onload = (e) => {
    var image = new Image()
    image.onload = (e) => render(image, idx)
    image.src = e.target.result
  }
  fileReader.onprogress = (e) => {
    var porc = Math.floor((e.loaded / e.total) * 100)
    progressbar.style.width = porc + '%'
    progresstext.innerHTML = porc + '%'
  }
  fileReader.readAsDataURL(listFiles[idx].file)
}

const render = (image, idx) => {
  let wRatio =  (image.width > image.height) ? max_width / image.width : max_width / image.height
  let hRatio = (image.width > image.height) ? max_height / image.height : max_height / image.width
  let width, height, x, y, rotate

  let canvas = document.createElement('canvas')
  let ctx = canvas.getContext('2d')
  canvas.width = max_width
  canvas.height = max_height
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0,0,max_width,max_height)

  if (crop) {
    width = Math.floor(image.width * ((wRatio > hRatio) ? wRatio : hRatio))
    height = Math.floor(image.height * ((wRatio > hRatio) ? wRatio : hRatio))
    rotate = (image.width < image.height) ? -90 : 0
  } else {
    width = Math.floor(image.width * ((wRatio > hRatio) ? hRatio : wRatio))
    height = Math.floor(image.height * ((wRatio > hRatio) ? hRatio : wRatio))
    rotate = (image.width < image.height) ? -90 : 0
  }
  console.log('(' + idx + ') ' + max_width + ' | ' + width + ' = | = ' + max_height + ' | ' + height)
  x = (max_width - width)/2 - (canvas.width/2)
  y = (max_height - height)/2 - (canvas.height/2)

  ctx.save()
  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.rotate(rotate*Math.PI/180);
  ctx.drawImage(image, x, y, width, height)
  ctx.restore()

  publish(canvas.toDataURL(), idx)
}

const publish = (src, idx) => {
  var li = displayList.childNodes[idx]
  var container = li.childNodes[0]
      container.classList.add('show')
  var progress = container.childNodes[1]
  var image = container.childNodes[0]
      image.onload = () => {
        //progress.style.display = 'none'
        image.onload = null
      }
      image.src = src
  listFiles[idx].status = "LOADED"
  checkLoaded()
}

const checkLoaded = () => {
  let check = true
  listFiles.forEach((item) => {
    if (item.status != "LOADED")
      check = false;
  })
  if (check) {
    alert('ALL IMAGES LOADED')
  }
}

const selElement = (e) => {
  let idx = Array.prototype.indexOf.call(e.currentTarget.parentElement.children, e.currentTarget)
  if (listFiles[idx].select) {
    listFiles[idx].select = false
    e.currentTarget.classList.remove('selected')
  } else {
    listFiles[idx].select = true
    e.currentTarget.classList.add('selected')
  }
  checkAllElement()
}

const selAllElement = (e) => {
  listFiles.forEach((item, idx) => {
    if (btAll.innerText == 'SELECIONAR TODOS') {
      listFiles[idx].select = true
      if (!displayList.childNodes[idx].classList.contains('selected')) {
        displayList.childNodes[idx].classList.add('selected')
      }
    } else {
      listFiles[idx].select = false
      if (displayList.childNodes[idx].classList.contains('selected')) {
        displayList.childNodes[idx].classList.remove('selected')
      }
    }
  })
  checkAllElement()
}

const checkAllElement = () => {
  let check = (listFiles.length == 0) ? false : true
  listFiles.forEach((item, idx) => {
    if (!item.select) check = false
  })
  if (check) btAll.innerText = 'DESELECIONAR TODOS'
  else btAll.innerText = 'SELECIONAR TODOS'
}

const removeElement = (e) => {
  listFiles.forEach((item, idx) => {
    if (item.select) {
      listFiles.splice(idx, 1)
      displayList.removeChild(displayList.childNodes[idx])
      removeElement(e)
      return;
    }
  })
  checkAllElement()
}

const upload = async (e) => {
  await listFiles.forEach((item, idx) => {
    send(idx)
  })
}

const send = async (idx) => {
  var li = displayList.childNodes[idx]
  var container = li.childNodes[0]
  var progress = container.childNodes[1]
  var progressbar = progress.childNodes[0]
  var progresstext = progress.childNodes[1]

      progressbar.style.width = '0%'
      progresstext.innerHTML = '0%'
      container.classList.remove('show')
      container.classList.add('upload')

  let data = new FormData()
      data.append('name', listFiles[idx].name)
      data.append('file', listFiles[idx].file)

  try {
    let res = await axios.post(urlApi, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        let porc = Math.floor((progressEvent.loaded / progressEvent.total) * 100)
        console.log(porc)
        progressbar.style.width = porc + '%'
        progresstext.innerHTML = porc + '%'
      }
    })
    listFiles[idx].status = "UPLOADED"
    progresstext.innerHTML = 'COMPLETE'
    checkUploaded()
  } catch (error) {
    console.log(error);
  }
}

const checkUploaded = () => {
  let check = true
  listFiles.forEach((item) => {
    if (item.status != "UPLOADED")
      check = false;
  })
  if (check) {
    alert('ALL IMAGES UPLOADED')
  }
}

init();
