'use strict';

// const startbtn = document.querySelector('#start');
const listFileInput = document.querySelector('#listFile');
const form = document.querySelector('#indexForm');
const folderInput = document.querySelector('#imageFolder');

class Main {
  constructor() {
    // startbtn.addEventListener('click', e => this._start(e));
    listFileInput.addEventListener('change', e => this._loadItemNames(e));
    form.addEventListener('submit', e => this._validateForm(e));
    folderInput.addEventListener('change', e => this._loadImagePaths(e));
  }

  _loadItemNames(event) {
    const listFile = event.target.files[0];
    if (!listFile) return;

    const reader = new FileReader();

    reader.onload = function (e) {
      const text = e.target.result;
      sessionStorage.setItem('textFileData', text);
    };

    reader.readAsText(listFile);
  }

  _start() {
    window.location.href = 'sort.html';
  }

  _loadImagePaths(event) {
    const files = Array.from(event.target.files);
    // Filter image files only (jpg, jpeg, png, etc.)
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    // Build a map of file names (without extensuon) to object URLs
    const imageMap = {};
    let loaded = 0;

    imageFiles.forEach(file => {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').toLowerCase();
      const reader = new FileReader();

      reader.onload = function (e) {
        imageMap[nameWithoutExt] = e.target.result;
        loaded++;

        // When all imgs are loaded, store in sessionStorage
        if (loaded === imageFiles.length) {
          sessionStorage.setItem('imageMap', JSON.stringify(imageMap));
        }
      };
      reader.readAsDataURL(file);
      //   const objectURL = URL.createObjectURL(file);
      //   imageMap[nameWithoutExt] = objectURL;
      // });

      // console.log(imageMap);

      // // Save in session storage as JSON
      // sessionStorage.setItem('imageMap', JSON.stringify(imageMap));
    });
  }

  _validateForm(event) {
    const itemType = document.forms['indexForm']['itemType'].value.trim();
    if (itemType === '') {
      alert('Item Type must be filled out.');
      event.preventDefault();
    }
    if (itemType.length < 3 || itemType.length > 20) {
      alert('Item Type length must be between 3 and 20 characters.');
      event.preventDefault();
    }

    // Store item type for next page
    sessionStorage.setItem('itemType', itemType);
  }
}

const main = new Main();
