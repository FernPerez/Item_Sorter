'use strict';
////////////////////////////////////////////////////////////////////////////////////////////////////////////
const listFileInput = document.querySelector('#listFile');
const form = document.querySelector('#indexForm');
const folderInput = document.querySelector('#imageFolder');

const formContainer = document.querySelector('#formContainer');
const mainSubContainer = document.querySelector('#main__sub__container');

const title = document.querySelector('#title');

const sorterContainer = document.querySelector('#sorter__container');
const roundContainer = document.querySelector('#round__container');

// Confirm if user wants to unload to prevent data loss.
window.addEventListener('beforeunload', function (e) {
  // Cancel event
  e.preventDefault();

  return '';
});

class App {
  defaultImg = `imgs/default.webp`;
  imageMap = new Map();
  imgs = new Map();
  finishedRows = new Map();
  roundNum = 0;
  progress = -1;
  lastPick = undefined;
  divergences = [];
  states = [];
  tieGroups = new Map();
  entries = [];
  imgsValidated = false;

  constructor() {
    listFileInput.addEventListener('change', e => this._loadItemNames(e));
    form.addEventListener('submit', e => this._validateForm(e));
    folderInput.addEventListener('change', e => this._loadImagePaths(e));
  }

  _loadItemNames(event) {
    const listFile = event.target.files[0];
    if (!listFile) return;

    const reader = new FileReader();

    reader.onload = e => {
      const text = e.target.result;
      this.entries = text.split(',').map(item => item.trim());
      this._validateTextFile(event, this.entries);
    };

    reader.readAsText(listFile);
  }

  _loadImagePaths(event) {
    const files = Array.from(event.target.files);
    // Filter image files only (jpg, jpeg, png, etc.)
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const imageNames = [];

    // Build a map of file names (without extensuon) to object URLs
    imageFiles.forEach(file => {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').toLowerCase();
      const objectURL = URL.createObjectURL(file);
      imageNames.push(nameWithoutExt);
      this.imageMap.set(nameWithoutExt, objectURL);
    });
    console.log(this.imageMap);
    this._validateImages(event, imageNames);
  }

  _validateForm(event) {
    event.preventDefault();
    const itemType = document.forms['indexForm']['itemType'].value.trim();
    if (itemType === '') {
      alert('ERROR: Item Type must be filled out.');
      event.preventDefault();
    }
    if (itemType.length < 3 || itemType.length > 20) {
      alert('ERROR: Item Type length must be between 3 and 20 characters.');
      event.preventDefault();
    }

    // Change HTML to display the sort
    this._displaySort(itemType);

    // Go to main app
    this._sort();
  }

  _validateTextFile(event, entries) {
    if (entries.length < 3) {
      alert('ERROR: There must be at least 3 items in the list to be ranked.');
      listFileInput.value = '';
      event.preventDefault();
    } else if (entries.length > 100) {
      alert('ERROR: There can only be up to 100 items to be ranked.');
      listFileInput.value = '';
      event.preventDefault();
    }

    const uniqueEntriesSet = new Set(entries);
    const uniqueEntries = [...uniqueEntriesSet];

    if (uniqueEntries.length < entries.length) {
      uniqueEntries.forEach(entry => {
        const occurrences = entries.filter(item => item === entry).length;
        if (occurrences > 1) {
          alert(
            `ERROR: All items must be unique. ${entry} appears more than once.`
          );
        }
      });

      listFileInput.value = '';
      event.preventDefault();
    }
    entries.forEach(entry => {
      if (entry.length > 50) {
        alert(
          `ERROR: Items in the list can only be up to 50 characters long. Please shorten item "${entry}"`
        );
        listFileInput.value = '';
        event.preventDefault();
      }
    });
    // In the event that the user uploads the images first, we must check again to validate after the text file is uploaded.
    if (this.imgsValidated) {
      // alert(`Image folder input cleared due to new text file being selected.`);
      // this.imgsValidated = false;
      // folderInput.value = '';
      this.imgsValidated = false;
      this._validateImages(event, [...this.imageMap.keys()]);
    }
  }

  _validateImages(event, images) {
    // console.log(this.entries);
    // console.log(images);
    console.log(images);
    const noMatches = [];
    this.entries.forEach(name => {
      const trimmed = name.trim().replaceAll(' ', '_').toLowerCase();
      if (!images.includes(trimmed)) {
        noMatches.push(name);
      }
    });
    if (noMatches.length > 0) {
      alert(`WARNING: Could not find image for the following item(s):
        ${noMatches
          .map(noMatch => `* ${noMatch}`)
          .join(
            '`n'
          )}\nPlease correct the folder or hit submit if you wish to proceed anyway.`);
    }
    this.imgsValidated = true;
  }

  _displaySort(itemType) {
    formContainer.remove();
    title.textContent = `${itemType} Sorter`;
    mainSubContainer.insertAdjacentHTML(
      'afterbegin',
      `<div class="progress__container">
          <div class="progress__border">
            <h3 class="progress__counter">50%</h3>
            <div class="progress__bar w3-green"></div>
          </div>
        </div> <div class="sorter__container">
          <div class="sorter__option__container">
            <div class="results__result__img__container--big">
              <img src="imgs/default.webp" class="sorter__img" id="img1" />
            </div>
            <button class="sorter__selection__button" id="btn1">
              Choice 1
            </button>
          </div>
          <div class="sorter__middle__container">
            <button class="sorter__selection__button" id="tie">Tie</button>
            <button class="sorter__selection__button" id="undo">Undo</button>
          </div>
          <div class="sorter__option__container">
            <div class="results__result__img__container--big">
              <img src="imgs/default.webp" class="sorter__img" id="img2" />
            </div>
            <button class="sorter__selection__button" id="btn2">
              Choice 2
            </button>
          </div>
        </div>`
    );

    this.btn1 = document.querySelector('#btn1');
    this.btn2 = document.querySelector('#btn2');
    this.undobtn = document.querySelector('#undo');
    this.tiebtn = document.querySelector('#tie');
    this.img1 = document.querySelector('#img1');
    this.img2 = document.querySelector('#img2');
    this.rounds = document.querySelector('#round__container');
    this.roundLbl = document.querySelector('#round__label');
    this.progressBar = document.querySelector('.progress__bar');
    this.progressCounter = document.querySelector('.progress__counter');
    this.sorterContainer = document.querySelector('.sorter__container');
  }

  _sort() {
    // Load Image URLs
    this.entries.forEach(name => {
      const trimmed = name.trim().replaceAll(' ', '_').toLowerCase();
      const imgSrc = this.imageMap.get(trimmed);

      this.imgs.set(name, imgSrc);
    });

    // Initial setup and display
    // Add select calls to both buttons
    this.btn1.addEventListener('click', e =>
      this._select(e.target.textContent)
    );
    this.btn2.addEventListener('click', e =>
      this._select(e.target.textContent)
    );

    // Add undo call to undo button
    this.undobtn.addEventListener('click', e => this._undo());

    // Add tie call to tie button
    this.tiebtn.addEventListener('click', e =>
      this._tie(this.row, this.column)
    );

    // Randomize the entries
    this._shuffleArray(this.entries);

    // Initialize finished rows map and generate img names
    for (let i = 0; i < this.entries.length; i++) {
      this.finishedRows.set(i, false);
    }

    // Generate the matrix for this sort
    this.matrix = this._generateMatrix(this.entries);

    // Generate Tie Groups
    this._generateTieGroups();

    // Subtract length to account for spaces filled with x
    this.maxProgress =
      this.matrix.length * this.matrix.length - this.matrix.length;

    // Load the first comparison of the sort
    [this.row, this.column] = this._findNewComparison(this.matrix);
    this._loadBothChoices(this.entries[this.row], this.entries[this.column]);

    // Update rounds display
    this.rounds.style.display = 'flex';
    this.roundLbl.textContent = `Round ${this.roundNum}`;
    this._updateProgress();
  }
  _loadBothChoices(choice1, choice2, change = 'up') {
    // Updates the contents of both buttons, images
    this.btn1.textContent = choice1;
    this.btn2.textContent = choice2;
    this._updateRounds(change);
    this._displayImgs(choice1, choice2);
    console.log(`${choice1} vs ${choice2}`);
  }
  _displayImgs(choice1, choice2) {
    this.img1.src = this.imgs.get(choice1) || this.defaultImg;
    this.img2.src = this.imgs.get(choice2) || this.defaultImg;
  }

  _select(choice) {
    // Primary method called when button is pressed. Updates matrix with choices, calls to find next comparisons and moves on to next choice.
    console.log(
      `You selected ${choice}!` // Current row and column are ${row}x${column}`
    );

    // Update sort states list
    this._updateStatesList();

    // this._updateTieGroup(this.column, 'decrease');

    // If the selection is different than the previous selection, a divergence has occured.
    if (choice !== this.lastPick && this.lastPick !== undefined) {
      this.divergences.push(this.entries.indexOf(this.lastPick));
    }
    // Update last pick to current choice.
    this.lastPick = choice;

    // The choice is equal to the row that is currently being traversed
    if (this.entries[this.row] === choice) {
      // console.log('You selected row');
      this._fillWithOne(this.row, this.column);
      this._fillWithZero(this.column, this.row);
      this._inheritSuperiority(this.row, this.column);

      this._updateTieGroup(this.row, this.column);

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
      // console.log('You selected column');
      this._fillWithOne(this.column, this.row);
      this._fillWithZero(this.row, this.column);
      this._inheritSuperiority(this.column, this.row);

      this._updateTieGroup(this.column, this.row);

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
    if (this.matrix[x][y] === 1) return;
    this._updateProgress();
    this.matrix[x][y] = 1;
  }

  _fillWithZero(x, y) {
    // Update progress bar and fill the given coords with 0
    if (this.matrix[x][y] === 0) return;
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

  _tie(choice1, choice2) {
    // Called to tie the current two choices, making them copy each other's rows and columns in the matrix &
    // adding them to each other's tie lists

    // Update sort states list
    this._updateStatesList();

    // Add each entry to tieGroups with the other as a tied item
    this.tieGroups.get(choice1).push(choice2);
    this.tieGroups.get(choice2).push(choice1);

    // Propagate ties
    this._updateTieGroup(choice1, choice2, 'tie');
    this._updateTieGroup(choice2, choice1, 'tie');

    //Fill each other's comparison spot in the matrix with 1.
    this._fillWithOne(choice1, choice2);
    this._fillWithOne(choice2, choice1);

    // Iterate through rows to duplicate everything
    let check1 = this.matrix[choice1][0];
    let check2 = this.matrix[choice2][0];
    let i = 0;

    while (i < this.entries.length) {
      if (check1 === -1 && check2 !== -1 && check2 !== 'x') {
        this.matrix[choice1][i] = this.matrix[choice2][i];
        this._updateProgress();
        this.matrix[i][choice1] = this.matrix[i][choice2];
        this._updateProgress();
      } else if (check2 === -1 && check1 !== -1 && check1 !== 'x') {
        this.matrix[choice2][i] = this.matrix[choice1][i];
        this._updateProgress();
        this.matrix[i][choice2] = this.matrix[i][choice1];
        this._updateProgress();
      }

      i++;
      check1 = this.matrix[choice1][i];
      check2 = this.matrix[choice2][i];
    }

    // Load next comparison
    [this.row, this.column] = this._findNextComparison(
      this.matrix,
      this.row + 2,
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

  _updateTieGroup(selected, nonselected, operation = 'non-tie') {
    // Propagates rankings by ties, checking if the selected option is tied to something and then
    // making sure those ties inherit the same ranking updates as it
    // console.log(selected);
    if (this.tieGroups.get(selected).length === 0) return;

    console.log(`${selected} has ties!`);

    if (operation === 'tie') {
      for (const tiedItem of this.tieGroups.get(selected)) {
        if (
          tiedItem === nonselected ||
          this.tieGroups.get(tiedItem).includes(nonselected)
        )
          continue;
        console.log(`${nonselected} is not in ${tiedItem}'s list.`);
        this._tie(tiedItem, nonselected);
      }
      return;
    }

    // First, have the nonselected's tied entries inherit the inferiority
    for (const tiedItem of this.tieGroups.get(nonselected)) {
      this._fillWithZero(tiedItem, selected);
      this._fillWithOne(selected, tiedItem);
    }

    // Second, have the selected's tied entries inherit the superiority
    for (const tiedItem of this.tieGroups.get(selected)) {
      this._fillWithOne(tiedItem, nonselected);
      this._fillWithZero(nonselected, tiedItem);

      // Ensure that the item inherits the superiority of the nonselected one
      this._inheritSuperiority(tiedItem, nonselected);

      // Third, have the nonselected's ties inherit inferiority to all of selected's ties
      for (const nonselect_tie of this.tieGroups.get(nonselected)) {
        this._fillWithZero(nonselect_tie, tiedItem);
        this._fillWithOne(tiedItem, nonselect_tie);
      }
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
    if (nextComparison !== -1)
      return nextComparison; // potential BUG here when tying (gave indexOf error)
    else {
      // No more comparisons left in the row. Indicate that the row is finished and return null.
      this.finishedRows.set(row, true);
      return null;
    }
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
  _generateTieGroups() {
    for (let i = 0; i <= this.entries.length; i++) {
      this.tieGroups.set(i, []);
    }
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
    // Renders the HTML to display the results when the sort is over.
    console.log(this.imgs);
    console.log(results[0][0]);
    // Display Top 3 Results
    this.sorterContainer.insertAdjacentHTML(
      'afterend',
      `<div class="results__container">
        <div class="results__result__container--big results__result__container--first">
          <div class="results__result__img__container--big">
            <img src="${this.imgs.get(
              results[0][0]
            )}" class="results__result__img" />
          </div>
          <h2 class="results__result__name--big">1. ${results[0][0]}</h2>
        </div>
        <div class="results__result__container--big results__result__container--second">
          <div class="results__result__img__container--big">
            <img src="${this.imgs.get(
              results[1][0]
            )}" class="results__result__img" />
          </div>
          <h2 class="results__result__name--big">2. ${results[1][0]}</h2>
        </div>
        <div class="results__result__container--big results__result__container--third">
          <div class="results__result__img__container--big">
            <img src="${this.imgs.get(
              results[2][0]
            )}" class="results__result__img">
          </div>
          <h2 class="results__result__name--big">3. ${results[2][0]}</h2>
        </div>
        ${this._renderSecondResults(results) || ''}
        ${this._renderRemainingResults(results) || ''}    
      </div>`
    );
  }

  _renderSecondResults(results) {
    // Returns HTML for the results ranked 4 up to 18 if applicable
    let i = 3;
    if (i >= results.length) return;
    let html = `<div class="results__container--four__to__eighteen">`;
    while (i < results.length && i <= 17) {
      html += `<div class="results__result__container--med">
            <div class="results__result__img__container--med">
              <img src="${this.imgs.get(
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

  _renderRemainingResults(results) {
    // Returns the HTMl for any remaining results after rank 18 if applicable
    let i = 18;
    if (i >= results.length) return;
    let html = `<div class="results__container--remainder">`;
    while (i < results.length) {
      html += `<div class="results_result_remainder_row">
            <div class="results_result_remainder_rank_col">${i + 1}. </div>
            <div class="results_result_remainder_entry_col">${
              results[i][0]
            }</div>
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

  _updateRounds(change) {
    // Update the rounds display
    if (change === 'up') this.roundNum++;
    else this.roundNum--;

    this.roundLbl.textContent = `Round ${this.roundNum}`;
  }

  _updateProgress(change = 'up') {
    // Update progress bar
    if (change === 'up') this.progress++;
    else this.progress = change;

    console.log(`Progress: ${this.progress}`);

    const percentage = ((this.progress / this.maxProgress) * 100).toFixed(2);
    // console.log(
    //   `Progress is ${this.progress}/${this.maxProgress}: ${percentage}%`
    // );
    this.progressBar.style.width = `${percentage}%`;
    this.progressCounter.textContent = `${Number(percentage).toFixed(0)}%`;
    if (percentage >= 12) {
      this.progressCounter.style.left = `${(percentage / 2).toFixed(2)}%`;
    } else {
      this.progressCounter.style.left = '40px';
    }
  }
  _updateStatesList() {
    // Create a deep copy of the matrix
    const matrixCopy = this.matrix.map(row => [...row]);

    // Create new state based off current sort state and push it to states list
    const state = new State(
      matrixCopy,
      [this.entries[this.row], this.entries[this.column]],
      this.lastPick,
      this.row,
      this.column,
      this.progress,
      this.finishedRows,
      this.tieGroups
    );
    this.states.push(state);

    // No more than 10 previous states saved.
    if (this.states.length > 10) {
      this.states.shift();
    }
  }

  _undo() {
    // Reverts sort  state to previous turn by going back to the last state in the states list
    if (this.states.length === 0) {
      console.log('Maximum undo depth reached. Cannot go back further!');
      return;
    }

    // Get last state from states list
    const lastState = this.states[this.states.length - 1];
    console.log(lastState);

    // Set Matrix to previous matrix
    this.matrix = lastState.matrix;

    // Set last pick to previous last pick
    this.lastPick = lastState.lastPick;

    // Set finishedRows to previous finished rows
    this.finishedRows = lastState.finishedRows;

    // Set tieGroups to previous tieGroups
    this.tieGroups = lastState.tieGroups;

    // Set choices to previous choices and decrease progress
    this._loadBothChoices(lastState.choices[0], lastState.choices[1], 'down');
    this._updateProgress(lastState.progress);

    this.row = lastState.row;
    this.column = lastState.column;

    console.log(this.row);
    console.log(this.column);

    this.states.pop();
  }
}

// State class used to store the data of the previous state of the sort before progress is made so as to
// revert back to it when the user clicks "Undo"
class State {
  constructor(
    matrix,
    choices,
    lastPick,
    row,
    column,
    progress,
    finishedRows,
    tieGroups
  ) {
    this.matrix = matrix;
    this.choices = choices;
    this.lastPick = lastPick;
    this.row = row;
    this.column = column;
    this.progress = progress;

    // Shallow copy finished rows
    this.finishedRows = new Map(finishedRows);

    // Deep copy tieGroups
    this.tieGroups = new Map();
    for (const [key, value] of tieGroups) {
      this.tieGroups.set(key, Array.isArray(value) ? [...value] : value);
    }
  }
}

const app = new App();

/* LOG

05/31/2025
 1) Fix image desyncing
 2) Fix update progress bug, seems to be related to the tie feature
 3) There was a problem seemingly when doing two initial ties, then when the second tie is compared to a new item, selecting the new item would cause a problem. Look into. 

06/14/2025
  1) Text file and image upload feature.
  2) Fix image desyncing
  3) There was a problem seemingly when doing two initial ties, then when the second tie is compared to a new item, selecting the new item would cause a problem. Look into. 

07/05/2025
  1) Landing page 'Type of Sort' Option
  2) Image Folder Selection
  3) Item Validity Check
  4) Image Validity Check
  5) Fix image desyncing
  6) There was a problem seemingly when doing two initial ties, then when the second tie is compared to a new item, selecting the new item would cause a problem. Look into. 

07/12/2025
  1) Validate the text file's length and validity
  2) Read through image names to tell the user what items don't have an image and ask if they wish to proceed anyway
  3) Ask user to confirm before clicking back or refreshing sort page.
  4) Fix image desyncing (haven't been able to replicate)
  5) There was a problem seemingly when doing two initial ties, then when the second tie is compared to a new item, selecting the new item would cause a problem. Look into. (haven't been able to replicate)
  6) BUG in findCompforChoice. Error with indexOf after a tie that I have not been able to replicate.
*/
