'use strict';

const startbtn = document.querySelector('#start');
const listFileInput = document.querySelector('#listFile');

class Main {
  constructor() {
    startbtn.addEventListener('click', e => this._start(e));
    listFileInput.addEventListener('change', e => this._loadItemNames(e));
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
}

const main = new Main();
