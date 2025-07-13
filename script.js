'use strict';

// const startbtn = document.querySelector('#start');
const form = document.querySelector('#indexForm');

class Main {
  constructor() {
    // startbtn.addEventListener('click', e => this._start(e));
    form.addEventListener('submit', e => this._validateForm(e));
  }

  _validateForm(event) {}
}

const main = new Main();
