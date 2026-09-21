const state = {
  students: [],
  rows: 5,
  cols: 4,
  layout: [],
  deskCells: [],
  editMode: false,
  placingTeacherDesk: false,
  manualMode: false,
  displayMode: 'both',
  viewMode: 'teacher',
  showDeskNumbers: true,
  className: '3A',
  mirroringCode: '',
  generatedAt: new Date(),
  pointerDrag: null,
  teacherDesk: {
    row: -1,
    col: -1,
    width: 2,
  },
};

const STORAGE_KEY = 'disposizione-banchi-state';

const els = {
  studentName: document.getElementById('studentName'),
  studentSurname: document.getElementById('studentSurname'),
  addStudentBtn: document.getElementById('addStudentBtn'),
  rowsInput: document.getElementById('rowsInput'),
  colsInput: document.getElementById('colsInput'),
  className: document.getElementById('className'),
  mirroringCode: document.getElementById('mirroringCode'),
  showDeskNumbers: document.getElementById('showDeskNumbers'),
  displayMode: document.getElementById('displayMode'),
  generateBtn: document.getElementById('generateBtn'),
  manualModeBtn: document.getElementById('manualModeBtn'),
  resetBtn: document.getElementById('resetBtn'),
  studentList: document.getElementById('studentList'),
  layout: document.getElementById('layout'),
  classroomDocument: document.getElementById('classroomDocument'),
  teacherViewBtn: document.getElementById('teacherViewBtn'),
  studentViewBtn: document.getElementById('studentViewBtn'),
  printTeacherBtn: document.getElementById('printTeacherBtn'),
  printStudentBtn: document.getElementById('printStudentBtn'),
  classNamePrint: document.getElementById('classNamePrint'),
  generationDate: document.getElementById('generationDate'),
  mirroringCodePrint: document.getElementById('mirroringCodePrint'),
  editDesksBtn: document.getElementById('editDesksBtn'),
  placeTeacherDeskBtn: document.getElementById('placeTeacherDeskBtn'),
  classroomSetupHint: document.getElementById('classroomSetupHint'),
  importStudentsBtn: document.getElementById('importStudentsBtn'),
  exportStudentsBtn: document.getElementById('exportStudentsBtn'),
  studentFileInput: document.getElementById('studentFileInput'),
};

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    students: state.students,
    rows: state.rows,
    cols: state.cols,
    className: state.className,
    mirroringCode: state.mirroringCode,
    showDeskNumbers: state.showDeskNumbers,
    displayMode: state.displayMode,
    deskCells: state.deskCells,
    layout: state.layout,
    teacherDesk: state.teacherDesk,
    generatedAt: state.generatedAt,
  }));
}

function applyStudentData(data) {
  const students = Array.isArray(data) ? data : data?.students;
  if (!Array.isArray(students)) {
    throw new Error('Il file deve contenere un array students.');
  }

  state.students = students
    .filter((student) => student && typeof student === 'object')
    .map((student) => ({
      name: normalizeName(String(student.name || '')) || '-',
      surname: normalizeName(String(student.surname || '')) || '-',
    }));

  if (!Array.isArray(data)) {
    state.layout = [];
    renderStudentList();
    saveState();
    renderLayout();
    return;
  }

  state.rows = Math.max(1, Number(data.rows) || state.rows);
  state.cols = Math.max(1, Number(data.cols) || state.cols);
  state.className = normalizeName(String(data.className || state.className)) || '3A';
  state.mirroringCode = normalizeName(String(data.mirroringCode || ''));
  state.showDeskNumbers = data.showDeskNumbers !== false;
  state.displayMode = ['both', 'name', 'surname'].includes(data.displayMode)
    ? data.displayMode
    : state.displayMode;
  state.deskCells = Array.isArray(data.deskCells) ? data.deskCells : [];
  state.layout = Array.isArray(data.layout) ? data.layout : [];
  state.teacherDesk = data.teacherDesk && typeof data.teacherDesk === 'object'
    ? { ...state.teacherDesk, ...data.teacherDesk }
    : state.teacherDesk;

  els.rowsInput.value = state.rows;
  els.colsInput.value = state.cols;
  els.className.value = state.className;
  els.mirroringCode.value = state.mirroringCode;
  els.showDeskNumbers.checked = state.showDeskNumbers;
  els.displayMode.value = state.displayMode;
  ensureDeskMap();
  renderStudentList();
  saveState();
  renderLayout();
}

function exportClassFile() {
  syncSettings();
  const fileContent = JSON.stringify({
    schemaVersion: 1,
    className: state.className,
    mirroringCode: state.mirroringCode,
    rows: state.rows,
    cols: state.cols,
    showDeskNumbers: state.showDeskNumbers,
    displayMode: state.displayMode,
    students: state.students,
    deskCells: state.deskCells,
    teacherDesk: state.teacherDesk,
    layout: state.layout,
  }, null, 2);
  const file = new Blob([fileContent], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  const safeClassName = (state.className || 'classe').replace(/[^a-z0-9_-]+/gi, '_');
  link.download = `${safeClassName}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function loadDefaultStudentFile() {
  try {
    const response = await fetch('studenti.json', { cache: 'no-store' });
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    const students = Array.isArray(data) ? data : data.students;
    if (Array.isArray(students)) {
      applyStudentData(data);
    }
  } catch (error) {
    // The app remains usable when opened without a local server.
  }
}

function loadSavedState() {
  const savedState = localStorage.getItem(STORAGE_KEY);
  if (!savedState) {
    return false;
  }

  try {
    const saved = JSON.parse(savedState);
    Object.assign(state, {
      students: Array.isArray(saved.students) ? saved.students : [],
      rows: Number(saved.rows) || state.rows,
      cols: Number(saved.cols) || state.cols,
      className: saved.className || state.className,
      mirroringCode: saved.mirroringCode || '',
      showDeskNumbers: saved.showDeskNumbers !== false,
      displayMode: saved.displayMode || state.displayMode,
      deskCells: Array.isArray(saved.deskCells) ? saved.deskCells : [],
      layout: Array.isArray(saved.layout) ? saved.layout : [],
      teacherDesk: saved.teacherDesk || state.teacherDesk,
      generatedAt: saved.generatedAt || state.generatedAt,
    });
    els.rowsInput.value = state.rows;
    els.colsInput.value = state.cols;
    els.className.value = state.className;
    els.mirroringCode.value = state.mirroringCode;
    els.showDeskNumbers.checked = state.showDeskNumbers;
    els.displayMode.value = state.displayMode;
    return true;
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return false;
  }
}

function normalizeName(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function formatGeneratedDate(date) {
  return new Date(date).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
  }
  return copy;
}

function buildStudentMarkup(student) {
  const nameText = student.name || '';
  const surnameText = student.surname || '';

  if (state.displayMode === 'name') {
    return `<div class="student-info"><span class="desk-name">${nameText}</span></div>`;
  }

  if (state.displayMode === 'surname') {
    return `<div class="student-info"><span class="desk-surname">${surnameText}</span></div>`;
  }

  return `
    <div class="student-info">
      <span class="desk-name">${nameText}</span>
      <span class="desk-surname">${surnameText}</span>
    </div>
  `;
}

function fitStudentText(deskEl) {
  const info = deskEl.querySelector('.student-info');
  const textElements = deskEl.querySelectorAll('.desk-name, .desk-surname');
  if (!info || !textElements.length || !info.clientWidth) {
    return;
  }

  let fontSize = parseFloat(getComputedStyle(textElements[0]).fontSize);
  const minimumSize = 5;
  const availableWidth = info.clientWidth * 0.92;

  while (fontSize > minimumSize && [...textElements].some((element) => element.scrollWidth > availableWidth)) {
    fontSize -= 0.5;
    textElements.forEach((element) => {
      element.style.fontSize = `${fontSize}px`;
    });
  }

  const widestText = Math.max(...[...textElements].map((element) => element.scrollWidth));
  const horizontalScale = widestText > availableWidth ? availableWidth / widestText : 1;
  textElements.forEach((element) => {
    element.style.setProperty('--student-text-scale', horizontalScale.toFixed(3));
  });
}

function renderStudentList() {
  if (!state.students.length) {
    els.studentList.innerHTML = '<li><span>Nessuno studente aggiunto</span></li>';
    return;
  }

  els.studentList.innerHTML = state.students
    .map(
      (student, index) => `
        <li>
          <span class="student-name">${student.name} ${student.surname}</span>
          <button class="remove-btn" data-index="${index}" aria-label="Rimuovi studente">×</button>
        </li>
      `
    )
    .join('');

  document.querySelectorAll('.remove-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const targetIndex = Number(button.dataset.index);
      state.students.splice(targetIndex, 1);
      renderStudentList();
      saveState();
      if (!state.layout.length) {
        renderLayout();
      }
    });
  });
}

function syncSettings() {
  state.rows = Math.max(1, Number(els.rowsInput.value) || 1);
  state.cols = Math.max(1, Number(els.colsInput.value) || 1);
  state.className = normalizeName(els.className.value) || '3A';
  state.mirroringCode = normalizeName(els.mirroringCode.value);
  state.showDeskNumbers = els.showDeskNumbers.checked;
  state.displayMode = els.displayMode.value;
  ensureDeskMap();

  els.classNamePrint.textContent = state.className;
  els.generationDate.textContent = formatGeneratedDate(state.generatedAt);
  els.mirroringCodePrint.textContent = state.mirroringCode || '-';
}

function ensureDeskMap() {
  const previousMap = state.deskCells;
  state.deskCells = Array.from({ length: state.rows }, (_, rowIndex) => (
    Array.from({ length: state.cols }, (_, colIndex) => previousMap[rowIndex]?.[colIndex] || false)
  ));
}

function getDeskCount() {
  return state.deskCells.flat().filter(Boolean).length;
}

function getDeskNumber(rowIndex, colIndex) {
  let number = 0;
  for (let row = 0; row < state.rows; row += 1) {
    for (let col = 0; col < state.cols; col += 1) {
      if (!state.deskCells[row][col] || isTeacherDeskCell(row, col)) {
        continue;
      }
      number += 1;
      if (row === rowIndex && col === colIndex) {
        return number;
      }
    }
  }
  return number;
}

function toggleDesk(rowIndex, colIndex) {
  if (isTeacherDeskCell(rowIndex, colIndex)) {
    return;
  }

  const currentStudent = state.layout[rowIndex]?.[colIndex];
  if (currentStudent) {
    return;
  }

  ensureDeskMap();
  state.deskCells[rowIndex][colIndex] = !state.deskCells[rowIndex][colIndex];
  els.classroomSetupHint.textContent = `${getDeskCount()} banchi configurati. ${state.students.length} studenti inseriti.`;
  saveState();
  renderLayout();
}

function placeTeacherDesk(rowIndex, colIndex) {
  if (colIndex + state.teacherDesk.width > state.cols) {
    return;
  }

  for (let offset = 0; offset < state.teacherDesk.width; offset += 1) {
    if (state.deskCells[rowIndex]?.[colIndex + offset]) {
      return;
    }
  }

  state.teacherDesk.row = rowIndex;
  state.teacherDesk.col = colIndex;
  state.placingTeacherDesk = false;
  saveState();
  renderLayout();
}

function dataToSeatArray() {
  const totalSeats = getDeskCount();
  const shuffledStudents = shuffle(state.students);
  const fullLayout = Array.from({ length: state.rows }, () => Array(state.cols).fill(null));
  const deskPositions = [];

  for (let row = 0; row < state.rows; row += 1) {
    for (let col = 0; col < state.cols; col += 1) {
      if (state.deskCells[row][col] && !isTeacherDeskCell(row, col)) {
        deskPositions.push({ row, col });
      }
    }
  }

  if (!totalSeats) {
    window.alert('Aggiungi almeno un banco alla disposizione prima di generare.');
    return false;
  }

  if (state.students.length > totalSeats) {
    window.alert(`Hai ${state.students.length} studenti, ma hai configurato solo ${totalSeats} banchi.`);
    return false;
  }

  deskPositions.forEach(({ row, col }, index) => {
    fullLayout[row][col] = shuffledStudents[index] || null;
  });

  state.generatedAt = new Date();
  state.layout = fullLayout;
  syncSettings();
  saveState();
  return true;
}

function handleCellClick(rowIndex, colIndex) {
  const placingTeacherDesk = state.placingTeacherDesk;
  const editingDesks = state.editMode;

  if (placingTeacherDesk) {
    placeTeacherDesk(rowIndex, colIndex);
    return;
  }

  if (editingDesks) {
    toggleDesk(rowIndex, colIndex);
  }
}

function isTeacherDeskCell(row, col) {
  return row === state.teacherDesk.row && col >= state.teacherDesk.col && col < state.teacherDesk.col + state.teacherDesk.width;
}

function moveStudent(from, to) {
  if (isTeacherDeskCell(from.row, from.col) || isTeacherDeskCell(to.row, to.col)) {
    return;
  }

  if (!state.layout[from.row] || !state.layout[to.row]) {
    return;
  }

  const sourceValue = state.layout[from.row][from.col];
  const targetValue = state.layout[to.row][to.col];

  if (sourceValue === undefined || targetValue === undefined) {
    return;
  }

  state.layout[from.row][from.col] = targetValue;
  state.layout[to.row][to.col] = sourceValue;
  saveState();
  renderLayout();
}

function handleDeskDrop(event, rowIndex, colIndex) {
  event.preventDefault();
  if (!event.dataTransfer) {
    return;
  }

  const payload = JSON.parse(event.dataTransfer.getData('text/plain') || '{}');
  if (payload.type === 'student') {
    moveStudent({ row: payload.row, col: payload.col }, { row: rowIndex, col: colIndex });
  }
  if (payload.type === 'teacherDesk') {
    moveTeacherDesk(rowIndex, colIndex);
  }
}

function startPointerDrag(event, type, rowIndex, colIndex, deskEl) {
  if (!state.manualMode || event.pointerType === 'mouse' || event.button !== 0) {
    return;
  }

  state.pointerDrag = {
    pointerId: event.pointerId,
    type,
    row: rowIndex,
    col: colIndex,
    deskEl,
  };
  deskEl.classList.add('pointer-dragging');
  deskEl.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function finishPointerDrag(event) {
  const drag = state.pointerDrag;
  if (!drag || drag.pointerId !== event.pointerId) {
    return;
  }

  const target = document.elementFromPoint(event.clientX, event.clientY)
    ?.closest('[data-row][data-col]');
  drag.deskEl.classList.remove('pointer-dragging');
  state.pointerDrag = null;

  if (!target || !els.layout.contains(target)) {
    return;
  }

  const rowIndex = Number(target.dataset.row);
  const colIndex = Number(target.dataset.col);
  if (drag.type === 'student' && target.classList.contains('desk') && !target.classList.contains('teacher-desk')) {
    moveStudent({ row: drag.row, col: drag.col }, { row: rowIndex, col: colIndex });
  }
  if (drag.type === 'teacherDesk') {
    moveTeacherDesk(rowIndex, colIndex);
  }
}

function moveTeacherDesk(toRow, toCol) {
  const maxCol = Math.max(0, state.cols - state.teacherDesk.width);
  const safeRow = Math.min(state.rows - 1, Math.max(0, toRow));
  const safeCol = Math.min(maxCol, Math.max(0, toCol));

  if (toCol + state.teacherDesk.width > state.cols) {
    return;
  }

  for (let offset = 0; offset < state.teacherDesk.width; offset += 1) {
    if (state.deskCells[safeRow]?.[safeCol + offset]) {
      return;
    }
  }

  state.teacherDesk.row = safeRow;
  state.teacherDesk.col = safeCol;
  saveState();
  renderLayout();
}

function buildTeacherDeskCell(rowIndex, colIndex, isPreview = false) {
  const deskEl = document.createElement('div');
  deskEl.className = 'teacher-desk';
  deskEl.setAttribute('role', 'gridcell');
  deskEl.dataset.row = String(rowIndex);
  deskEl.dataset.col = String(colIndex);
  deskEl.style.gridColumn = `span ${state.teacherDesk.width}`;
  deskEl.title = 'Cattedra';
  deskEl.draggable = !isPreview && !state.editMode;

  if (!isPreview) {
    deskEl.addEventListener('pointerdown', (event) => {
      startPointerDrag(event, 'teacherDesk', rowIndex, colIndex, deskEl);
    });
  }

  const label = document.createElement('span');
  label.textContent = 'Cattedra';
  deskEl.appendChild(label);

  if (!isPreview && !state.editMode) {
    deskEl.addEventListener('dragstart', (event) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify({ type: 'teacherDesk', row: rowIndex, col: colIndex }));
    });

    deskEl.addEventListener('dragover', (event) => {
      event.preventDefault();
    });

    deskEl.addEventListener('drop', (event) => {
      event.preventDefault();
      if (!event.dataTransfer) {
        return;
      }

      const payload = JSON.parse(event.dataTransfer.getData('text/plain') || '{}');
      if (payload.type === 'teacherDesk') {
        moveTeacherDesk(rowIndex, colIndex);
          return;
      }
        if (payload.type === 'student') {
          if (!isTeacherDeskCell(rowIndex, colIndex)) {
            moveStudent({ row: payload.row, col: payload.col }, { row: rowIndex, col: colIndex });
          }
      }
    });
  }

  return deskEl;
}

function buildDeskCell(student, rowIndex, colIndex, isPreview = false) {
  const deskEl = document.createElement('div');
  deskEl.className = 'desk';
  deskEl.setAttribute('role', 'gridcell');
  deskEl.dataset.row = String(rowIndex);
  deskEl.dataset.col = String(colIndex);
  deskEl.draggable = Boolean(student) && !isPreview;

  if (student && !isPreview) {
    deskEl.addEventListener('pointerdown', (event) => {
      startPointerDrag(event, 'student', rowIndex, colIndex, deskEl);
    });
  }

  if (!isPreview) {
    deskEl.addEventListener('dragover', (event) => event.preventDefault());
    deskEl.addEventListener('drop', (event) => handleDeskDrop(event, rowIndex, colIndex));
  }

  if (!student) {
    deskEl.classList.add('empty');
    return deskEl;
  }

  const studentInfo = document.createElement('div');
  studentInfo.className = 'student-info';
  if (state.viewMode === 'teacher') {
    studentInfo.classList.add('student-facing');
  }
  studentInfo.innerHTML = buildStudentMarkup(student);

  if (state.showDeskNumbers) {
    const numberBadge = document.createElement('span');
    numberBadge.className = 'desk-number';
    numberBadge.textContent = `#${getDeskNumber(rowIndex, colIndex)}`;
    deskEl.appendChild(numberBadge);
  }

  deskEl.appendChild(studentInfo);

  if (!isPreview) {
    deskEl.addEventListener('dragstart', (event) => {
      if (!student) {
        return;
      }
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify({ type: 'student', row: rowIndex, col: colIndex }));
    });

  }

  return deskEl;
}

function renderLayout() {
  syncSettings();

  els.layout.innerHTML = '';
  els.classroomDocument.classList.toggle('teacher-view', state.viewMode === 'teacher');
  els.layout.style.setProperty('--cols', state.cols);
  els.layout.classList.toggle('manual-mode', state.manualMode);

  const teacherDeskStart = { row: state.teacherDesk.row, col: state.teacherDesk.col };

  for (let rowIndex = 0; rowIndex < state.rows; rowIndex += 1) {
    const rowEl = document.createElement('div');
    rowEl.className = 'layout-row';
    rowEl.dataset.columns = String(state.cols);

    let colIndex = 0;
    while (colIndex < state.cols) {
      if (rowIndex === teacherDeskStart.row && colIndex === teacherDeskStart.col) {
        rowEl.appendChild(buildTeacherDeskCell(rowIndex, colIndex, false));
        colIndex += state.teacherDesk.width;
        continue;
      }

      if (!state.deskCells[rowIndex][colIndex]) {
        const floorCell = document.createElement('div');
        floorCell.className = 'floor-cell';
        floorCell.dataset.row = String(rowIndex);
        floorCell.dataset.col = String(colIndex);
        if (!state.editMode && !state.placingTeacherDesk) {
          floorCell.addEventListener('dragover', (event) => event.preventDefault());
          floorCell.addEventListener('drop', (event) => {
            event.preventDefault();
            const payload = JSON.parse(event.dataTransfer?.getData('text/plain') || '{}');
            if (payload.type === 'teacherDesk') {
              moveTeacherDesk(rowIndex, colIndex);
            }
          });
        }
        rowEl.appendChild(floorCell);
        colIndex += 1;
        continue;
      }

      const student = state.layout[rowIndex]?.[colIndex] || null;
      rowEl.appendChild(buildDeskCell(student, rowIndex, colIndex, false));
      colIndex += 1;
    }

    els.layout.appendChild(rowEl);
    rowEl.querySelectorAll('.desk').forEach(fitStudentText);
  }
}

function addStudent() {
  const name = normalizeName(els.studentName.value);
  const surname = normalizeName(els.studentSurname.value);

  if (!name && !surname) {
    window.alert('Aggiungi almeno nome o cognome per creare uno studente.');
    return;
  }

  state.students.push({
    name: name || '-',
    surname: surname || '-',
  });

  els.studentName.value = '';
  els.studentSurname.value = '';
  els.studentName.focus();

  renderStudentList();
  saveState();
  if (state.layout.length) {
    dataToSeatArray();
    renderLayout();
  }
}

function resetClassroom() {
  state.students = [];
  state.layout = [];
  state.deskCells = [];
  state.editMode = false;
  state.placingTeacherDesk = false;
  state.manualMode = false;
  state.generatedAt = new Date();
  syncSettings();
  els.studentList.innerHTML = '<li><span>Nessuno studente aggiunto</span></li>';
  els.manualModeBtn.classList.remove('active');
  els.manualModeBtn.textContent = 'Sistemazione manuale';
  els.layout.innerHTML = '';
  localStorage.removeItem(STORAGE_KEY);
}

function renderPreviewSheet(viewMode = state.viewMode) {
  const previewTarget = document.getElementById('pdfPreviewSheet');
  previewTarget.innerHTML = '';
  previewTarget.className = `pdf-preview-sheet${viewMode === 'teacher' ? ' teacher-view' : ''}`;

  const previewHeader = document.createElement('header');
  previewHeader.className = 'doc-topbar';
  previewHeader.innerHTML = `
    <div class="doc-date-wrap">
      <p class="doc-subtitle">Data generazione</p>
      <h3>${formatGeneratedDate(state.generatedAt)}</h3>
    </div>
    <div class="doc-class-wrap">
      <p class="doc-subtitle">Classe</p>
      <h3>${state.className}</h3>
    </div>
    <div class="doc-mirroring-wrap">
      <p class="doc-subtitle">Duplicazione schermo</p>
      <h3>${state.mirroringCode || '-'}</h3>
    </div>
  `;
  previewTarget.appendChild(previewHeader);

  const previewGrid = document.createElement('div');
  previewGrid.className = 'layout-grid';
  previewGrid.classList.toggle('student-mirror', viewMode === 'student');

  const teacherDeskStart = { row: state.teacherDesk.row, col: state.teacherDesk.col };

  for (let rowIndex = 0; rowIndex < state.rows; rowIndex += 1) {
    const rowEl = document.createElement('div');
    rowEl.className = 'layout-row';
    rowEl.dataset.columns = String(state.cols);

    let colIndex = 0;
    while (colIndex < state.cols) {
      if (rowIndex === teacherDeskStart.row && colIndex === teacherDeskStart.col) {
        rowEl.appendChild(buildTeacherDeskCell(rowIndex, colIndex, true));
        colIndex += state.teacherDesk.width;
        continue;
      }

      if (!state.deskCells[rowIndex][colIndex]) {
        const floorCell = document.createElement('div');
        floorCell.className = 'floor-cell';
        rowEl.appendChild(floorCell);
        colIndex += 1;
        continue;
      }

      const student = state.layout[rowIndex]?.[colIndex] || null;
      const deskEl = buildDeskCell(student, rowIndex, colIndex, true);
      rowEl.appendChild(deskEl);
      colIndex += 1;
    }

    previewGrid.appendChild(rowEl);
  }

  previewTarget.appendChild(previewGrid);
  previewGrid.querySelectorAll('.desk').forEach(fitStudentText);
}

function openPreviewModal(viewMode = state.viewMode) {
  state.viewMode = viewMode;
  els.teacherViewBtn.classList.toggle('active', viewMode === 'teacher');
  els.studentViewBtn.classList.toggle('active', viewMode === 'student');
  renderLayout();
  renderPreviewSheet(viewMode);

  const modal = document.getElementById('pdfPreviewModal');
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closePreviewModal() {
  const modal = document.getElementById('pdfPreviewModal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function setupPrint(viewMode) {
  state.viewMode = viewMode;
  els.teacherViewBtn.classList.toggle('active', viewMode === 'teacher');
  els.studentViewBtn.classList.toggle('active', viewMode === 'student');
  renderLayout();
  window.print();
}

els.layout.addEventListener('click', (event) => {
  const cell = event.target.closest('[data-row][data-col]');
  if (!cell || !els.layout.contains(cell)) {
    return;
  }

  handleCellClick(Number(cell.dataset.row), Number(cell.dataset.col));
});

els.layout.addEventListener('pointermove', (event) => {
  if (state.pointerDrag?.pointerId === event.pointerId) {
    event.preventDefault();
  }
});

els.layout.addEventListener('pointerup', finishPointerDrag);
els.layout.addEventListener('pointercancel', finishPointerDrag);

els.addStudentBtn.addEventListener('click', addStudent);
els.importStudentsBtn.addEventListener('click', () => els.studentFileInput.click());
els.studentFileInput.addEventListener('change', async () => {
  const [file] = els.studentFileInput.files;
  if (!file) {
    return;
  }

  try {
    const data = JSON.parse(await file.text());
    applyStudentData(data);
  } catch (error) {
    window.alert('Il file studenti non è un JSON valido.');
  } finally {
    els.studentFileInput.value = '';
  }
});
els.exportStudentsBtn.addEventListener('click', exportClassFile);
els.studentName.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addStudent();
  }
});
els.studentSurname.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addStudent();
  }
});
els.generateBtn.addEventListener('click', () => {
  if (!state.students.length) {
    window.alert('Aggiungi almeno uno studente prima di generare la disposizione.');
    return;
  }

  if (dataToSeatArray()) {
    renderLayout();
  }
});
els.editDesksBtn.addEventListener('click', () => {
  state.manualMode = false;
  els.manualModeBtn.classList.remove('active');
  state.editMode = !state.editMode;
  state.placingTeacherDesk = false;
  els.editDesksBtn.classList.toggle('active', state.editMode);
  els.classroomSetupHint.textContent = state.editMode
    ? 'Clicca una cella per aggiungere o rimuovere un banco.'
    : `${getDeskCount()} banchi configurati. Aggiungi gli studenti e genera la disposizione.`;
  renderLayout();
});
els.placeTeacherDeskBtn.addEventListener('click', () => {
  state.manualMode = false;
  els.manualModeBtn.classList.remove('active');
  state.editMode = false;
  state.placingTeacherDesk = !state.placingTeacherDesk;
  els.editDesksBtn.classList.remove('active');
  els.placeTeacherDeskBtn.classList.toggle('active', state.placingTeacherDesk);
  els.classroomSetupHint.textContent = state.placingTeacherDesk
    ? 'Clicca una posizione libera per inserire la cattedra larga due celle.'
    : `${getDeskCount()} banchi configurati.`;
  renderLayout();
});
els.manualModeBtn.addEventListener('click', () => {
  state.editMode = false;
  state.placingTeacherDesk = false;
  state.manualMode = !state.manualMode;
  els.editDesksBtn.classList.remove('active');
  els.placeTeacherDeskBtn.classList.remove('active');
  els.manualModeBtn.classList.toggle('active', state.manualMode);
  els.manualModeBtn.textContent = state.manualMode ? 'Chiudi sistemazione manuale' : 'Sistemazione manuale';
  els.classroomSetupHint.textContent = state.manualMode
    ? 'Trascina un banco: lo studente resterà agganciato. Puoi spostarlo su un altro banco o su un posto vuoto.'
    : `${getDeskCount()} banchi configurati. La disposizione automatica resta invariata.`;
  renderLayout();
});
els.resetBtn.addEventListener('click', resetClassroom);
els.rowsInput.addEventListener('input', () => {
  syncSettings();
  saveState();
  if (state.layout.length) {
    state.layout = [];
    renderLayout();
  }
});
els.colsInput.addEventListener('input', () => {
  syncSettings();
  saveState();
  if (state.layout.length) {
    state.layout = [];
    renderLayout();
  }
});
els.className.addEventListener('input', () => {
  syncSettings();
  saveState();
});
els.mirroringCode.addEventListener('input', () => {
  syncSettings();
  saveState();
});
els.showDeskNumbers.addEventListener('change', () => {
  syncSettings();
  saveState();
  renderLayout();
});
els.displayMode.addEventListener('change', () => {
  syncSettings();
  saveState();
  if (state.layout.length) {
    renderLayout();
  }
});
els.teacherViewBtn.addEventListener('click', () => {
  state.viewMode = 'teacher';
  renderLayout();
  els.teacherViewBtn.classList.add('active');
  els.studentViewBtn.classList.remove('active');
});
els.studentViewBtn.addEventListener('click', () => {
  state.viewMode = 'student';
  renderLayout();
  els.teacherViewBtn.classList.remove('active');
  els.studentViewBtn.classList.add('active');
});
els.previewPdfBtn = document.getElementById('previewPdfBtn');
els.closePreviewBtn = document.getElementById('closePreviewBtn');
els.confirmPrintBtn = document.getElementById('confirmPrintBtn');

els.previewPdfBtn.addEventListener('click', () => openPreviewModal(state.viewMode));
els.closePreviewBtn.addEventListener('click', closePreviewModal);
els.confirmPrintBtn.addEventListener('click', () => {
  closePreviewModal();
  setupPrint(state.viewMode);
});

document.querySelector('[data-close-preview="true"]').addEventListener('click', closePreviewModal);
els.printTeacherBtn.addEventListener('click', () => setupPrint('teacher'));
els.printStudentBtn.addEventListener('click', () => setupPrint('student'));

const restoredState = loadSavedState();
syncSettings();
renderStudentList();

window.addEventListener('DOMContentLoaded', async () => {
  ensureDeskMap();
  if (!restoredState) {
    await loadDefaultStudentFile();
  }
  renderStudentList();
  renderLayout();
});
