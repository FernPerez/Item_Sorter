'use strict';
////////////////////////////////////////////////////////////////////////////////////////////////////////////

const btn1 = document.querySelector('#btn1');
const btn2 = document.querySelector('#btn2');
const img1 = document.querySelector('#img1');
const img2 = document.querySelector('#img2');
const rounds = document.querySelector('#roundContainer');
const roundLbl = document.querySelector('#roundLabel');
const btns = document.querySelectorAll('.selectionButton');

class App {
  defaultImg = `imgs/default.webp`;
  imgNames = new Map();
  finishedRows = new Map();
  roundNum = 0;
  progress = -1;
  lastPick = undefined;
  divergences = [];
  entries = [
    // ZZZ
    'Ellen Joe',
    'Zhu Yuan',
    'Jane Doe',
    'Caesar King',
    'Burnice White',
    'Yanagi Tsukishiro',
    'Miyabi Hoshimi',
    'Nicole Demara',
    // HSR
    'Firefly',
    'Kafka',
    'Acheron',
    // 'Seele',
    // 'Silver Wolf',
    // 'Topaz',
    // 'Jingliu',
    // 'Ruan Mei',
    // 'Black Swan',
    // 'Sparkle',
    // 'Feixiao',
    // 'Lingsha',
    // 'Tingyun',
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
      img.src = defaultImg;
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
    console.log(
      `Progress is ${this.progress}/${this.maxProgress}: ${
        (this.progress / this.maxProgress) * 100
      }%`
    );
  }
}

const app = new App();

// const defaultImg = `imgs/default.webp`;

// btn1.addEventListener('click', function () {
//   select(this.textContent);
// });

// btn2.addEventListener('click', function () {
//   select(this.textContent);
// });

// function shuffleArray(array) {
//   for (let i = array.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     const temp = array[i];
//     array[i] = array[j];
//     array[j] = temp;
//   }
// }
// const entries = [
//   // ZZZ
//   'Ellen Joe',
//   'Zhu Yuan',
//   'Jane Doe',
//   'Caesar King',
//   'Burnice White',
//   'Yanagi Tsukishiro',
//   'Miyabi Hoshimi',
//   'Nicole Demara',
//   // HSR
//   'Firefly',
//   'Kafka',
//   'Acheron',
//   'Seele',
//   'Silver Wolf',
//   'Topaz',
//   'Jingliu',
//   'Ruan Mei',
//   'Black Swan',
//   'Sparkle',
//   'Feixiao',
//   'Lingsha',
//   'Tingyun',
// ];

// shuffleArray(entries);

// const imgNames = new Map();

// const finishedRows = new Map();
// for (let i = 0; i < entries.length; i++) {
//   finishedRows.set(i, false);
//   imgNames.set(entries[i], genImgName(entries[i]));
// }

// function genImgName(entryName) {
//   return `${entryName.toLowerCase().replaceAll(' ', '_')}.webp`;
// }

// function generateMatrix(entries) {
//   const matrix = new Array(entries.length);

//   for (let i = 0; i < entries.length; i++) {
//     matrix[i] = new Array(entries.length).fill(-1);
//     matrix[i][i] = 'x';
//   }
//   console.log(matrix);
//   return matrix;
// }

// function findNewComparison(entryMatrix) {
//   while (divergences.length > 0) {
//     const divergedRow = divergences[divergences.length - 1];
//     console.log(
//       `Divergence found. Checking if ${entries[divergedRow]} has comparisons left.`
//     );
//     const divergedCol = findCompForChoice(entryMatrix, divergedRow, 0);
//     divergences.splice(divergences.length - 1);
//     lastPick = entries[divergedRow];
//     if (divergedCol) {
//       console.log(`Comparison found at column ${divergedCol}`);
//       return [divergedRow, divergedCol];
//     }
//     console.log(
//       `No new comparison for ${entries[divergedRow]}. Checking for another divergence.`
//     );
//   }
//   console.log(
//     `No valid divergences found. Searching for brand new comparison.`
//   );
//   for (let row = 0; row < entryMatrix.length; row++) {
//     if (finishedRows.get(row)) continue;
//     const column = entryMatrix[row].indexOf(-1);
//     if (Number.isFinite(column) && column !== -1) {
//       // console.log(`New comparison to be made at row ${row}, column ${column}`);
//       lastPick = undefined;
//       return [row, column];
//     }
//   }
//   return [null, null];
// }
// function findCompForChoice(entryMatrix, row, col) {
//   const nextComparison = entryMatrix[row].indexOf(-1, col + 1);
//   if (nextComparison !== -1) return nextComparison;
//   else {
//     finishedRows.set(row, true);
//     return null;
//   }
// }

// function findNextComparison(entryMatrix, rowInp, colInp) {
//   let row, col;
//   col = findCompForChoice(entryMatrix, rowInp, colInp);
//   if (col) {
//     console.log(`col is ${col}`);
//     row = rowInp;
//   } else {
//     findCompForChoice(entryMatrix, colInp, 0);
//     [row, col] = findNewComparison(entryMatrix);
//   }
//   console.log(`${row} by ${col}`);
//   return [row, col];
// }

// function loadBothChoices(choice1, choice2) {
//   btn1.textContent = choice1;
//   btn2.textContent = choice2;
//   displayImgs(choice1, choice2);
//   updateRounds();
//   console.log(`${choice1} vs ${choice2}`);
// }

// function displayImgs(choice1, choice2) {
//   validateImgName(img1, `imgs/${imgNames.get(choice1)}`);
//   validateImgName(img2, `imgs/${imgNames.get(choice2)}`);
// }

// function validateImgName(img, path) {
//   const tempImg = new Image();

//   tempImg.onload = () => {
//     img.src = path;
//   };
//   tempImg.onerror = () => {
//     img.src = defaultImg;
//   };
//   tempImg.src = path;
// }

// function select(choice) {
//   console.log(
//     `You selected ${choice}!` // Current row and column are ${row}x${column}`
//   );
//   if (choice !== lastPick && lastPick !== undefined) {
//     divergences.push(entries.indexOf(lastPick));
//   }
//   lastPick = choice;
//   if (entries[row] === choice) {
//     fillWithOne(row, column);
//     fillWithZero(column, row);
//     inheritSuperiority(row, column);
//     // nextComparison = findCompForChoice(matrix, row, column);
//     [row, column] = findNextComparison(matrix, row, column);
//     if (row === null) {
//       console.log(`FINISHED`);
//       loadResults();
//       return;
//     }
//     // if (!nextComparison) return;
//     // column = nextComparison;
//     // console.log(`Next is at row ${row}, column ${column}: ${entries[column]}`);
//     loadBothChoices(entries[row], entries[column]);
//   } else {
//     fillWithOne(column, row);
//     fillWithZero(row, column);
//     inheritSuperiority(column, row);
//     [column, row] = findNextComparison(matrix, column, row);
//     if (row === null) {
//       console.log(`FINISHED`);
//       loadResults();
//       return;
//     }
//     // if (!nextComparison) return;
//     // column = nextComparison;
//     // console.log(`Next is at row ${column}, column ${row}: ${entries[row]}`);
//     loadBothChoices(entries[row], entries[column]);
//   }
// }

// function fillWithOne(x, y) {
//   updateProgress();
//   matrix[x][y] = 1;
// }

// function fillWithZero(x, y) {
//   updateProgress();
//   matrix[x][y] = 0;
// }

// function inheritSuperiority(inheritor, inherited) {
//   // console.log('----------------------------------------------');
//   // console.log(
//   //   `Checking if ${entries[inheritor]} can inherit from ${entries[inherited]}`
//   // );
//   let check = matrix[inherited][0];
//   let i = 0;
//   // console.log(`Check is ${check}`);
//   while (check !== undefined) {
//     // console.log(`Check is ${check}`);
//     if (check === 1) {
//       fillWithOne(inheritor, i);
//       fillWithZero(i, inheritor);
//     }
//     i++;
//     check = matrix[inherited][i];
//     // console.log(`Now check is ${check}`);
//   }
//   // console.log('----------------------------------------------');
// }

// function loadResults() {
//   const results = [];
//   for (let i = 0; i < matrix.length; i++) {
//     results.push([entries[i], getScore(matrix[i])]);
//   }
//   results.sort((a, b) => a[1] - b[1]);
//   console.log(results);
// }

// function getScore(rowInp) {
//   let score = 0;
//   for (num of rowInp) {
//     if (num === 1) score++;
//   }
//   return Math.abs(score - entries.length);
// }

// function updateRounds() {
//   roundNum++;
//   roundLbl.textContent = `Round ${roundNum}`;
// }

// function updateProgress() {
//   progress++;
//   console.log(
//     `Progress is ${progress}/${maxProgress}: ${(progress / maxProgress) * 100}%`
//   );
// }

// let roundNum = 0;
// let progress = -1;

// let lastPick = undefined;
// const divergences = [];

// const matrix = generateMatrix(entries);
// // Subtract length to account for spaces filled with x
// const maxProgress = matrix.length * matrix.length - matrix.length;
// let [row, column] = findNewComparison(matrix);
// loadBothChoices(entries[row], entries[column]);
// rounds.style.display = 'flex';
// roundLbl.textContent = `Round ${roundNum}`;
// updateProgress();

// let array = [5, 8];
// let [a, b] = array;
// console.log(a, b);
