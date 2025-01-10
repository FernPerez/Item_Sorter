'use strict';
////////////////////////////////////////////////////////////////////////////////////////////////////////////

const btn1 = document.querySelector('#btn1');
const btn2 = document.querySelector('#btn2');
const img1 = document.querySelector('#img1');
const img2 = document.querySelector('#img2');
const rounds = document.querySelector('#round__container');
const roundLbl = document.querySelector('#round__label');
const progressBar = document.querySelector('.progress__bar');
const progressCounter = document.querySelector('.progress__counter');
const btns = document.querySelectorAll('.sorter__selection__button');

const sorterContainer = document.querySelector('.sorter__container');

class App {
  defaultImg = `imgs/default.webp`;
  imgNames = new Map();
  finishedRows = new Map();
  roundNum = 0;
  progress = -1;
  lastPick = undefined;
  divergences = [];
  entries = [
    // Misc ----------------------------------------------------
    '2B',
    'C.C.',
    'Kallen Kozuki',
    'Albedo',
    'Rias Gremory',
    'Monika',
    'Nobara Kugisaki',
    // Chainsaw Man ----------------------------------------------------
    'Makima',
    'Reze',
    'Power',
    'Kobeni Higashiyama',
    'Asa Mitaka',
    // Touhou ----------------------------------------------------
    'Reisen Udongein',
    'Reimu Hakurei',
    'Sakuya Izayoi',
    // ZZZ ----------------------------------------------------
    'Ellen Joe',
    'Zhu Yuan',
    'Jane Doe',
    'Caesar King',
    // 'Burnice White',
    // // 'Yanagi Tsukishiro',
    // 'Miyabi Hoshimi',
    // // 'Nicole Demara',
    // // HSR ----------------------------------------------------
    // 'Firefly',
    // 'Kafka',
    // 'Acheron',
    // // 'Seele',
    // 'Silver Wolf',
    // 'Topaz',
    // // 'Jingliu',
    // 'Ruan Mei',
    // 'Black Swan',
    // // 'Sparkle',
    // // 'Feixiao',
    // // 'Lingsha',
    // 'Tingyun',
    // // 'Himeko',
    // // 'Sushang',
    // // 'Guinaifen',
    // // 'Hanya',
    // // 'March 7th',
    // 'Stelle',

    // // Genshin ----------------------------------------------------
    // // 'Jean',
    // // 'Mona',
    // // 'Keqing',
    // // 'Amber',
    // // 'Lisa',
    // // 'Fischl',
    // // 'Ningguang',
    // // 'Beidou',
    // 'Ganyu',
    // 'Hu Tao',
    // // 'Rosaria',
    // 'Eula',
    // // 'Ayaka',
    // // 'Yoimiya',
    // 'Raiden Shogun',
    // // 'Kujou Sara',
    // // 'Kokomi',
    // // 'Shenhe',
    // // 'Yun Jin',
    // // 'Yae Miko',
    // // 'Yelan',
    // // 'Shinobu',
    // // 'Collei',
    // // 'Candace',
    // // 'Nilou',
    // // 'Faruzan',
    // // 'Dehya',
    // // 'Lynette',
    // // 'Furina',
    // // 'Navia',
    // // 'Chevreuse',
    // 'Xianyun',
    // // 'Chiori',
    // 'Arlecchino',
    // 'Clorinde',
    // // 'Mualani',
    // // 'Xilonen',
    // // 'Mavuika',
    // // Fate Series ----------------------------------------------------
    // 'Artoria Pendragon',
    // `Jeanne d'Arc`,
    // 'Nero Claudius',
    // 'Rin Tohsaka',
    // 'Musashi Miyamoto',
    // 'Tamamo-no-Mae',
    // 'Ushiwakamaru',
    // 'Artoria Alter',
    // 'Jeanne Alter',
    // 'Florence Nightingale',
    // 'Morgan Le Fay',
    // 'Mordred',
    // 'Tomoe Gozen',
    // // Blue Archive ----------------------------------------------------
    // 'Aru',
    // 'Toki',
    // 'Asuna',
    // 'Ichika',
    // 'Ako',
    // 'Saori',
    // 'Karin',
    // 'Hasumi',
    // 'Koharu',
  ];
  constructor() {
    // Initial setup and display
    // Add select calls to both buttons
    btn1.addEventListener('click', e => this._select(e.target.textContent));
    btn2.addEventListener('click', e => this._select(e.target.textContent));

    // Randomize the entries
    this._shuffleArray(this.entries);

    // Initialize finished rows map and generate img names
    for (let i = 0; i < this.entries.length; i++) {
      this.finishedRows.set(i, false);
      this.imgNames.set(this.entries[i], this._genImgName(this.entries[i]));
    }

    // Generate the matrix for this sort
    this.matrix = this._generateMatrix(this.entries);

    // Subtract length to account for spaces filled with x
    this.maxProgress =
      this.matrix.length * this.matrix.length - this.matrix.length;

    // Load the first comparison of the sort
    [this.row, this.column] = this._findNewComparison(this.matrix);
    this._loadBothChoices(this.entries[this.row], this.entries[this.column]);

    // Update rounds display
    rounds.style.display = 'flex';
    roundLbl.textContent = `Round ${this.roundNum}`;
    this._updateProgress();
  }
  _loadBothChoices(choice1, choice2) {
    // Updates the contents of both buttons, images, and round label
    btn1.textContent = choice1;
    btn2.textContent = choice2;
    this._displayImgs(choice1, choice2);
    this._updateRounds();
    console.log(`${choice1} vs ${choice2}`);
  }
  _displayImgs(choice1, choice2) {
    // Updates both images.
    this._validateImgName(img1, `imgs/${this.imgNames.get(choice1)}`);
    this._validateImgName(img2, `imgs/${this.imgNames.get(choice2)}`);
  }
  _validateImgName(img, path) {
    // Checks if given path leads to an existing image file. Uses default img path if not.
    const tempImg = new Image();

    tempImg.onload = () => {
      img.src = path;
    };
    tempImg.onerror = () => {
      img.src = this.defaultImg;
    };
    tempImg.src = path;
  }
  _select(choice) {
    // Primary method called when button is pressed. Updates matrix with choices, calls to find next comparisons and moves on to next choice.
    console.log(
      `You selected ${choice}!` // Current row and column are ${row}x${column}`
    );
    // If the selection is different than the previous selection, a divergence has occured.
    if (choice !== this.lastPick && this.lastPick !== undefined) {
      this.divergences.push(this.entries.indexOf(this.lastPick));
    }
    // Update last pick to current choice.
    this.lastPick = choice;

    // The choice is equal to the row that is currently being traversed
    if (this.entries[this.row] === choice) {
      this._fillWithOne(this.row, this.column);
      this._fillWithZero(this.column, this.row);
      this._inheritSuperiority(this.row, this.column);
      [this.row, this.column] = this._findNextComparison(
        this.matrix,
        this.row,
        this.column
      );
      // No comparisons left, load results and end sort.
      if (this.row === null) {
        console.log(`FINISHED`);
        this._loadResults();
        return;
      }
      // Load next comparison into display
      this._loadBothChoices(this.entries[this.row], this.entries[this.column]);
    }
    // Choice is equal to the column, so switch to the row corresponding to that column.
    else {
      this._fillWithOne(this.column, this.row);
      this._fillWithZero(this.row, this.column);
      this._inheritSuperiority(this.column, this.row);
      [this.column, this.row] = this._findNextComparison(
        this.matrix,
        this.column,
        this.row
      );
      // No comparisons left, load results and end sort.
      if (this.row === null) {
        console.log(`FINISHED`);
        this._loadResults();
        return;
      }
      // Load next comparison into display
      this._loadBothChoices(this.entries[this.row], this.entries[this.column]);
    }
  }
  _fillWithOne(x, y) {
    // Update progress bar and fill the given coords with 1
    this._updateProgress();
    this.matrix[x][y] = 1;
  }

  _fillWithZero(x, y) {
    // Update progress bar and fill the given coords with 0
    this._updateProgress();
    this.matrix[x][y] = 0;
  }
  _inheritSuperiority(inheritor, inherited) {
    // Allows the victor of a comparison to inherit whatever its opponent is currently superior to.
    // Filling its respective row's columns with 1's and filling its inferiors' rows' respective column with 0's

    // Iterate through loser's row
    let check = this.matrix[inherited][0];
    let i = 0;
    // Ensure stopping point in row equals undefined as 0 counts as falsey value
    while (check !== undefined) {
      if (check === 1) {
        this._fillWithOne(inheritor, i);
        this._fillWithZero(i, inheritor);
      }
      i++;
      check = this.matrix[inherited][i];
    }
  }

  _findNextComparison(entryMatrix, rowInp, colInp) {
    // Called to search for the next comparison to be made and returned to be displayed.
    // Check if the current row has any comparisons left
    let row, col;
    col = this._findCompForChoice(entryMatrix, rowInp, colInp);
    if (col) {
      // console.log(`col is ${col}`);
      row = rowInp;
    } else {
      // If other option has no comparisons left to be made, set it to finished.
      this._findCompForChoice(entryMatrix, colInp, 0);
      // Find a new comparison, starting with the divergences.
      [row, col] = this._findNewComparison(entryMatrix);
    }
    // console.log(`${row} by ${col}`);
    return [row, col];
  }

  _findNewComparison(entryMatrix) {
    // Searches the matrix for a new comparison to be made.
    // First, look in the divergences array and see if any divergences have valid comparisons left
    while (this.divergences.length > 0) {
      const divergedRow = this.divergences[this.divergences.length - 1];
      console.log(
        `Divergence found. Checking if ${this.entries[divergedRow]} has comparisons left.`
      );
      const divergedCol = this._findCompForChoice(entryMatrix, divergedRow, 0);
      this.divergences.splice(this.divergences.length - 1);
      this.lastPick = this.entries[divergedRow];
      if (divergedCol) {
        console.log(`Comparison found at column ${divergedCol}`);
        return [divergedRow, divergedCol];
      }
      console.log(
        `No new comparison for ${this.entries[divergedRow]}. Checking for another divergence.`
      );
    }
    console.log(
      `No valid divergences found. Searching for brand new comparison.`
    );
    // If no valid divergences could be found, search the entire matrix from the start for a brand new comparison.
    for (let row = 0; row < entryMatrix.length; row++) {
      if (this.finishedRows.get(row)) continue; // Only check unfinished rows.
      const column = entryMatrix[row].indexOf(-1);
      if (Number.isFinite(column) && column !== -1) {
        this.lastPick = undefined;
        return [row, column];
      }
    }
    // No comparison left to be made in matrix. Return null to indicate that it's time to end sort.
    return [null, null];
  }
  _findCompForChoice(entryMatrix, row, col) {
    // Checks the given row, and searches for a new comparison column starting at the given column
    const nextComparison = entryMatrix[row].indexOf(-1, col + 1);
    if (nextComparison !== -1) return nextComparison;
    else {
      // No more comparisons left in the row. Indicate that the row is finished and return null.
      this.finishedRows.set(row, true);
      return null;
    }
  }

  _genImgName(entryName) {
    // Returns the name of the corresponding image
    return `${entryName.toLowerCase().replaceAll(' ', '_')}.webp`;
  }

  _shuffleArray(array) {
    // Called to randomize a given array
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }
  _generateMatrix(entries) {
    // Generates a square matrix of the same size as the entries array
    const matrix = new Array(entries.length);

    // Intersections where the row and column entry are the same are filled with 'x'.
    // Every other intersection filled with -1 to indicate being unfilled.
    for (let i = 0; i < entries.length; i++) {
      matrix[i] = new Array(entries.length).fill(-1);
      matrix[i][i] = 'x';
    }
    // console.log(matrix);
    return matrix;
  }
  _loadResults() {
    // Generates the full list of results in their appropriate rankings
    const results = [];
    for (let i = 0; i < this.matrix.length; i++) {
      results.push([this.entries[i], this._getScore(this.matrix[i])]);
    }
    results.sort((a, b) => a[1] - b[1]);
    console.log(results);
    this._renderResults(results);
  }

  _renderResults(results) {
    console.log(results[0]);
    sorterContainer.insertAdjacentHTML(
      'afterend',
      `<div class="results__container">
        <div class="results__result__container--big results__result__container--first">
          <div class="results__result__img__container--big">
            <img src="./imgs/${this.imgNames.get(
              results[0][0]
            )}" class="results__result__img" />
          </div>
          <h2 class="results__result__name--big">1. ${results[0][0]}</h2>
        </div>
        <div class="results__result__container--big results__result__container--second">
          <div class="results__result__img__container--big">
            <img src="./imgs/${this.imgNames.get(
              results[1][0]
            )}" class="results__result__img" />
          </div>
          <h2 class="results__result__name--big">2. ${results[1][0]}</h2>
        </div>
        <div class="results__result__container--big results__result__container--third">
          <div class="results__result__img__container--big">
            <img src="./imgs/${this.imgNames.get(
              results[2][0]
            )}" class="results__result__img">
          </div>
          <h2 class="results__result__name--big">3. ${results[2][0]}</h2>
        </div>
        ${this._renderSecondResults(results) || ''}
        
        <div class="results__container--remainder">
          <div class="results_result_remainder_row">
            <div class="results_result_remainder_rank_col">19. </div>
            <div class="results_result_remainder_entry_col">Row 1, Column 2</div>
          </div>
          <div class="results_result_remainder_row">
            <div class="results_result_remainder_rank_col">20. </div>
            <div class="results_result_remainder_entry_col">Row 1, Column 2</div>
          </div>
      </div>`
    );
  }

  _renderSecondResults(results) {
    let i = 3;
    if (i >= results.length) return;
    let html = `<div class="results__container--four__to__eighteen">`;
    while (i < results.length && i <= 17) {
      html += `<div class="results__result__container--med">
            <div class="results__result__img__container--med">
              <img src="./imgs/${this.imgNames.get(
                results[i][0]
              )}" class="results__result__img">
            </div>
            <h2 class="results__result__name--med">${i + 1}. ${
        results[i][0]
      }</h2>
          </div>`;
      i++;
    }
    html += `</div>`;
    return html;
  }

  _getScore(rowInp) {
    // Returns the score associated with an entry by adding up the 1's in its respective row
    let score = 0;
    for (const num of rowInp) {
      if (num === 1) score++;
    }
    // Subtract length to get the proper ranking
    return Math.abs(score - this.entries.length);
  }

  _updateRounds() {
    // Update the rounds display
    this.roundNum++;
    roundLbl.textContent = `Round ${this.roundNum}`;
  }

  _updateProgress() {
    // Update progress bar
    this.progress++;
    const percentage = ((this.progress / this.maxProgress) * 100).toFixed(2);
    // console.log(
    //   `Progress is ${this.progress}/${this.maxProgress}: ${percentage}%`
    // );
    progressBar.style.width = `${percentage}%`;
    progressCounter.textContent = `${Number(percentage).toFixed(0)}%`;
    if (percentage >= 12) {
      progressCounter.style.left = `${(percentage / 2).toFixed(2)}%`;
    } else {
      progressCounter.style.left = '40px';
    }
  }
}

const app = new App();
