require('./assets/scss/main.scss')
import empty from './assets/img/empty.png'

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
        listFiles.push({
          status: 'WAITING',
          porcentage: 0,
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

const insertElement = () => {
  let li = document.createElement('li')
      li.addEventListener('click', selElement)
  let container = document.createElement('div')
      container.classList.add('container')
  let progress = document.createElement('div')
      progress.classList.add('progress')
  let progressbar = document.createElement('div')
      progressbar.classList.add('progress-bar')
  let progresstext = document.createElement('span')
      progresstext.classList.add('progress-text')
      progresstext.innerHTML = '0%'
  let image = new Image()
      image.src = empty
  progress.appendChild(progressbar)
  progress.appendChild(progresstext)
  container.appendChild(progress)
  container.appendChild(image)
  li.appendChild(container)
  list.appendChild(li)
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
      if (!list.childNodes[idx].classList.contains('selected')) {
        list.childNodes[idx].classList.add('selected')
      }
    } else {
      listFiles[idx].select = false
      if (list.childNodes[idx].classList.contains('selected')) {
        list.childNodes[idx].classList.remove('selected')
      }
    }
  })
  checkAllElement()
}

const checkAllElement = (e) => {
  let check = true
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
      list.removeChild(list.childNodes[idx])
      removeElement(e)
      return;
    }
  })
}

const read = (idx) => {
  var li = list.childNodes[idx]
  var container = li.childNodes[0]
  var progress = container.childNodes[0]
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
  let wRatio =  max_width / image.width
  let hRatio = max_height / image.height
  let width, height, x, y
  let canvas = document.createElement('canvas')
  if (cropped) {
    width = Math.floor(image.width * ((wRatio > hRatio) ? wRatio : hRatio))
    height = Math.floor(image.height * ((wRatio > hRatio) ? wRatio : hRatio))
    console.log(idx + ': ' + width + '|' + height)
    canvas.width = max_width
    canvas.height = max_height
    x = (max_width - width)/2
    y = (max_height - height)/2
    canvas.getContext('2d').drawImage(image, x, y, width, height)
  } else {
    width = Math.floor(image.width * ((wRatio > hRatio) ? hRatio : hRatio))
    height = Math.floor(image.height * ((wRatio > hRatio) ? hRatio : hRatio))
    canvas.width = width
    canvas.height = height
    x = 0
    y = 0
    canvas.getContext('2d').drawImage(image, x, y, width, height)
  }
  publish(canvas.toDataURL(), idx)
}

const publish = (src, idx) => {
  var li = list.childNodes[idx]
  var container = li.childNodes[0]
      container.classList.add('show')
  var image = container.childNodes[1]
      image.src = src
  listFiles[idx].status = "LOADED"
}

let listFiles = []
let max_width = 450
let max_height = 300
let cropped = true

let btSelect = document.getElementById('btSelect')
let btAdd = document.getElementById('btAdd')
let btRemove = document.getElementById('btRemove')
let list = document.getElementById('list')
let selectUpload = document.getElementById('selectUpload')

btSelect.addEventListener('click', selectFiles)
btAdd.addEventListener('click', selectFiles)
btAll.addEventListener('click', selAllElement)
btRemove.addEventListener('click', removeElement)
