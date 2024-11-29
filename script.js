'use strict';
////////////////////////////////////////////////////////////////////////////////////////////////////////////

const btn1 = document.querySelector('#btn1');
const btn2 = document.querySelector('#btn2');
const img1 = document.querySelector('#img1');
const img2 = document.querySelector('#img2');
const rounds = document.querySelector('#roundContainer');
const roundLbl = document.querySelector('#roundLabel');
const btns = document.querySelectorAll('.selectionButton');

const defaultImg = `imgs/default.webp`;

btn1.addEventListener('click', function () {
  select(this.textContent);
});

btn2.addEventListener('click', function () {
  select(this.textContent);
});

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}
const entries = [
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
  'Seele',
  'Silver Wolf',
  'Topaz',
  'Jingliu',
  'Ruan Mei',
  'Black Swan',
  'Sparkle',
  'Feixiao',
  'Lingsha',
  'Tingyun',
];

shuffleArray(entries);

const imgNames = new Map();

const finishedRows = new Map();
for (let i = 0; i < entries.length; i++) {
  finishedRows.set(i, false);
  imgNames.set(entries[i], genImgName(entries[i]));
}

function genImgName(entryName) {
  return `${entryName.toLowerCase().replaceAll(' ', '_')}.webp`;
}

function generateMatrix(entries) {
  const matrix = new Array(entries.length);

  for (let i = 0; i < entries.length; i++) {
    matrix[i] = new Array(entries.length).fill(-1);
    matrix[i][i] = 'x';
  }
  console.log(matrix);
  return matrix;
}

function findNewComparison(entryMatrix) {
  while (divergences.length > 0) {
    const divergedRow = divergences[divergences.length - 1];
    console.log(
      `Divergence found. Checking if ${entries[divergedRow]} has comparisons left.`
    );
    const divergedCol = findCompForChoice(entryMatrix, divergedRow, 0);
    divergences.splice(divergences.length - 1);
    lastPick = entries[divergedRow];
    if (divergedCol) {
      console.log(`Comparison found at column ${divergedCol}`);
      return [divergedRow, divergedCol];
    }
    console.log(
      `No new comparison for ${entries[divergedRow]}. Checking for another divergence.`
    );
  }
  console.log(
    `No valid divergences found. Searching for brand new comparison.`
  );
  for (let row = 0; row < entryMatrix.length; row++) {
    if (finishedRows.get(row)) continue;
    const column = entryMatrix[row].indexOf(-1);
    if (Number.isFinite(column) && column !== -1) {
      // console.log(`New comparison to be made at row ${row}, column ${column}`);
      lastPick = undefined;
      return [row, column];
    }
  }
  return [null, null];
}
function findCompForChoice(entryMatrix, row, col) {
  const nextComparison = entryMatrix[row].indexOf(-1, col + 1);
  if (nextComparison !== -1) return nextComparison;
  else {
    finishedRows.set(row, true);
    return null;
  }
}

function findNextComparison(entryMatrix, rowInp, colInp) {
  let row, col;
  col = findCompForChoice(entryMatrix, rowInp, colInp);
  if (col) {
    console.log(`col is ${col}`);
    row = rowInp;
  } else {
    findCompForChoice(entryMatrix, colInp, 0);
    [row, col] = findNewComparison(entryMatrix);
  }
  console.log(`${row} by ${col}`);
  return [row, col];
}

function loadBothChoices(choice1, choice2) {
  btn1.textContent = choice1;
  btn2.textContent = choice2;
  displayImgs(choice1, choice2);
  updateRounds();
  console.log(`${choice1} vs ${choice2}`);
}

function displayImgs(choice1, choice2) {
  validateImgName(img1, `imgs/${imgNames.get(choice1)}`);
  validateImgName(img2, `imgs/${imgNames.get(choice2)}`);
}

function validateImgName(img, path) {
  const tempImg = new Image();

  tempImg.onload = () => {
    img.src = path;
  };
  tempImg.onerror = () => {
    img.src = defaultImg;
  };
  tempImg.src = path;
}

function select(choice) {
  console.log(
    `You selected ${choice}!` // Current row and column are ${row}x${column}`
  );
  if (choice !== lastPick && lastPick !== undefined) {
    divergences.push(entries.indexOf(lastPick));
  }
  lastPick = choice;
  if (entries[row] === choice) {
    fillWithOne(row, column);
    fillWithZero(column, row);
    inheritSuperiority(row, column);
    // nextComparison = findCompForChoice(matrix, row, column);
    [row, column] = findNextComparison(matrix, row, column);
    if (row === null) {
      console.log(`FINISHED`);
      loadResults();
      return;
    }
    // if (!nextComparison) return;
    // column = nextComparison;
    // console.log(`Next is at row ${row}, column ${column}: ${entries[column]}`);
    loadBothChoices(entries[row], entries[column]);
  } else {
    fillWithOne(column, row);
    fillWithZero(row, column);
    inheritSuperiority(column, row);
    [column, row] = findNextComparison(matrix, column, row);
    if (row === null) {
      console.log(`FINISHED`);
      loadResults();
      return;
    }
    // if (!nextComparison) return;
    // column = nextComparison;
    // console.log(`Next is at row ${column}, column ${row}: ${entries[row]}`);
    loadBothChoices(entries[row], entries[column]);
  }
}

function fillWithOne(x, y) {
  updateProgress();
  matrix[x][y] = 1;
}

function fillWithZero(x, y) {
  updateProgress();
  matrix[x][y] = 0;
}

function inheritSuperiority(inheritor, inherited) {
  // console.log('----------------------------------------------');
  // console.log(
  //   `Checking if ${entries[inheritor]} can inherit from ${entries[inherited]}`
  // );
  let check = matrix[inherited][0];
  let i = 0;
  // console.log(`Check is ${check}`);
  while (check !== undefined) {
    // console.log(`Check is ${check}`);
    if (check === 1) {
      fillWithOne(inheritor, i);
      fillWithZero(i, inheritor);
    }
    i++;
    check = matrix[inherited][i];
    // console.log(`Now check is ${check}`);
  }
  // console.log('----------------------------------------------');
}

function loadResults() {
  const results = [];
  for (let i = 0; i < matrix.length; i++) {
    results.push([entries[i], getScore(matrix[i])]);
  }
  results.sort((a, b) => a[1] - b[1]);
  console.log(results);
}

function getScore(rowInp) {
  let score = 0;
  for (num of rowInp) {
    if (num === 1) score++;
  }
  return Math.abs(score - entries.length);
}

function updateRounds() {
  roundNum++;
  roundLbl.textContent = `Round ${roundNum}`;
}

function updateProgress() {
  progress++;
  console.log(
    `Progress is ${progress}/${maxProgress}: ${(progress / maxProgress) * 100}%`
  );
}

let roundNum = 0;
let progress = -1;

let lastPick = undefined;
const divergences = [];

const matrix = generateMatrix(entries);
// Subtract length to account for spaces filled with x
const maxProgress = matrix.length * matrix.length - matrix.length;
let [row, column] = findNewComparison(matrix);
loadBothChoices(entries[row], entries[column]);
rounds.style.display = 'flex';
roundLbl.textContent = `Round ${roundNum}`;
updateProgress();

let array = [5, 8];
let [a, b] = array;
console.log(a, b);
