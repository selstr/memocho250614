// 할 일 데이터를 저장할 배열
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let editingId = null;
let weekEditingIdx = null;
let currentWeekOffset = 0; // 0: 이번 주, 1: 다음 주 ... 4: 5주 후
const MAX_WEEK_OFFSET = 4;

// 날짜와 시간을 표시하는 함수
function updateDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[now.getDay()];
    
    const dateTimeStr = `${year}-${month}-${day}-${weekday}-${hours}:${minutes}:${seconds}`;
    document.getElementById('currentDateTime').textContent = dateTimeStr;
}

// 페이지 로드 시 저장된 할 일 표시
window.onload = function() {
    displayTodos();
    updateDateTime();
    // 1초마다 날짜와 시간 업데이트
    setInterval(updateDateTime, 1000);
    renderPhraseArea();
};

// 입력창에서 Enter 키로 메모 추가
window.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('todoInput');
    if (input) {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && input.value.trim() !== '') {
                addTodo();
            }
        });
    }
});

// 할 일 추가 함수
function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    if (text === '') {
        alert('할 일을 입력해주세요!');
        return;
    }
    const todo = {
        id: Date.now(),
        text: text,
        completed: false
    };
    todos.unshift(todo);
    saveTodos();
    displayTodos();
    input.value = '';
    renderWeekCalendar(); // 캘린더 갱신
}

// 할 일 완료 여부 토글 함수
function toggleTodo(id) {
    todos = todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos();
    displayTodos();
}

// 할 일 삭제 함수
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    displayTodos();
    renderWeekCalendar();
}

// 모든 할 일 삭제 함수
function clearAll() {
    if (confirm('모든 할 일을 삭제하시겠습니까?')) {
        todos = [];
        saveTodos();
        displayTodos();
        renderWeekCalendar();
    }
}

function editTodo(id) {
    editingId = id;
    displayTodos();
}

function saveEdit(id) {
    const editInput = document.getElementById('editInput_' + id);
    const newText = editInput.value.trim();
    if (newText === '') {
        alert('메모 내용을 입력해주세요!');
        return;
    }
    todos = todos.map(todo =>
        todo.id === id ? { ...todo, text: newText } : todo
    );
    editingId = null;
    saveTodos();
    displayTodos();
}

// 할 일 저장 함수
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// 할 일 표시 함수
function displayTodos() {
    const list = document.getElementById('todoList');
    list.innerHTML = '';
    const today = new Date().getDay();
    // 오늘 요일 메모, 일반 메모, 지난 요일 메모로 분리
    const todayMemos = [];
    const normalMemos = [];
    const pastMemos = [];
    todos.forEach(todo => {
        if (typeof todo.weekday === 'number') {
            if (todo.weekday === today) {
                todayMemos.push(todo);
            } else {
                pastMemos.push(todo);
            }
        } else {
            normalMemos.push(todo);
        }
    });
    // 지난 요일 메모를 오늘에 가까운 순서로 정렬
    pastMemos.sort((a, b) => {
        let diffA = (a.weekday - today + 7) % 7;
        let diffB = (b.weekday - today + 7) % 7;
        return diffA - diffB;
    });
    // 오늘 요일 메모 → 일반 메모 → 지난 요일 메모 순서로 표시
    [...todayMemos, ...normalMemos, ...pastMemos].forEach(todo => {
        const item = document.createElement('div');
        item.className = 'todo-item' + (todo.completed ? ' completed' : '');
        if (editingId === todo.id) {
            item.innerHTML = `
                <button class=\"check-btn\" disabled>${todo.completed ? '✔️' : '☑️'}</button>
                <input type=\"text\" id=\"editInput_${todo.id}\" value=\"${todo.text.replace(/\"/g, '&quot;')}\" class=\"edit-input\" />
                <button class=\"edit-btn\" onclick=\"saveEdit(${todo.id})\">✔️</button>
                <button class=\"delete-btn\" onclick=\"deleteTodo(${todo.id})\">🗑️</button>
            `;
        } else {
            item.innerHTML = `
                <button class=\"check-btn\" onclick=\"toggleTodo(${todo.id})\">${todo.completed ? '✔️' : '☑️'}</button>
                <span>${todo.text}</span>
                <button class=\"edit-btn\" onclick=\"editTodo(${todo.id})\">✏️</button>
                <button class=\"delete-btn\" onclick=\"deleteTodo(${todo.id})\">🗑️</button>
            `;
        }
        list.appendChild(item);
    });
}

// Service Worker 등록
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

function selectAllMemos() {
    // 모든 메모 텍스트를 한 줄씩 모아서 하나의 문자열로 만듦
    const allText = todos.map(todo => todo.text).join('\n');
    // 임시 textarea 생성
    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = allText;
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    try {
        document.execCommand('copy');
        alert('모든 메모가 복사되었습니다!');
    } catch (err) {
        alert('복사에 실패했습니다. 직접 복사해 주세요.');
    }
    document.body.removeChild(tempTextarea);
}

// 멋진 구절 표시/입력 기능
function renderPhraseArea() {
    const area = document.getElementById('phraseArea');
    const savedPhrase = localStorage.getItem('memo_phrase') || '';
    if (savedPhrase) {
        area.innerHTML = `
            <div class="phrase-box">
                <span class="phrase-text">${savedPhrase}</span>
                <span class="phrase-dot" id="phraseDot"></span>
            </div>
        `;
        setTimeout(() => {
            const dot = document.getElementById('phraseDot');
            if(dot) dot.addEventListener('click', openPhraseModal);
        }, 0);
    } else {
        area.innerHTML = `
            <form class="phrase-box" onsubmit="savePhrase(event)">
                <input type="text" class="phrase-input" id="phraseInput" placeholder="멋진 구절을 입력하세요">
                <button class="phrase-save-btn" type="submit">저장</button>
            </form>
        `;
        setTimeout(() => {
            const input = document.getElementById('phraseInput');
            if (input) input.focus();
        }, 0);
    }
}

function openPhraseModal() {
    const modal = document.getElementById('phraseModal');
    const input = document.getElementById('phraseModalInput');
    input.value = localStorage.getItem('memo_phrase') || '';
    modal.style.display = 'flex';
    setTimeout(() => {
        input.focus();
        input.select(); // 기존 문구 전체 선택
    }, 0);
}
function closePhraseModal() {
    document.getElementById('phraseModal').style.display = 'none';
}
function savePhrase(e) {
    e.preventDefault();
    const input = document.getElementById('phraseInput');
    const value = input.value.trim();
    if (!value) {
        alert('멋진 문구는 비워둘 수 없습니다!');
        return;
    }
    localStorage.setItem('memo_phrase', value);
    renderPhraseArea();
}
window.addEventListener('DOMContentLoaded', function() {
    document.getElementById('phraseModalSaveBtn').onclick = savePhrase;
    document.getElementById('phraseModalCancelBtn').onclick = closePhraseModal;
    document.getElementById('phraseModalInput').onkeydown = function(e) {
        if (e.key === 'Enter') savePhrase();
    };
    document.getElementById('phraseModal').onclick = function(e) {
        if (e.target === this) closePhraseModal();
    };
});

// 일주일 캘린더 표시 함수
function renderWeekCalendar() {
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    const todayObj = new Date();
    const today = todayObj.getDay();
    // 이번 주 일요일 날짜 구하기
    const sunday = new Date(todayObj);
    sunday.setDate(todayObj.getDate() - today + currentWeekOffset * 7);
    // 요일별 날짜 배열 만들기
    const weekDates = [];
    const weekDateObjs = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        weekDates.push(('0' + d.getDate()).slice(-2));
        weekDateObjs.push(new Date(d));
    }
    // 요일별 해당 날짜에 입력된 메모 개수 계산 (최대 3개)
    const counts = [0,0,0,0,0,0,0];
    todos.forEach(todo => {
        if (typeof todo.weekday === 'number' && todo.dateStr) {
            for (let i = 0; i < 7; i++) {
                // 메모의 날짜와 weekDateObjs[i]가 같고, 요일도 같아야 함
                if (todo.weekday === i && todo.dateStr === weekDateObjs[i].toISOString().slice(0,10)) {
                    counts[i]++;
                }
            }
        }
    });
    const calendar = document.getElementById('weekCalendar');
    calendar.className = 'week-calendar';
    calendar.innerHTML = weekDays.map((d, i) => {
        let dots = '';
        const dotCount = Math.min(counts[i], 3);
        for (let j = 0; j < dotCount; j++) {
            dots += '<div class="dot"></div>';
        }
        for (let j = dotCount; j < 3; j++) {
            dots += '<div class="dot dot-empty"></div>';
        }
        // 입력창 표시
        let inputHtml = '';
        if (weekEditingIdx === i && currentWeekOffset === 0) {
            inputHtml = `<input class='weekday-input' id='weekdayInput${i}' data-idx='${i}' placeholder='(${d}) 메모를 적어주세요' onkeydown='if(event.key==="Enter"){addWeekdayMemo(this)}'>`;
        }
        // 오늘 표시(이번 주만)
        const isToday = (currentWeekOffset === 0 && i === today);
        return `<div class="weekday${isToday ? ' today' : ''}" data-idx="${i}">
            ${d}(${weekDates[i]})
            <div class="dots-col">${dots}${inputHtml}</div>
        </div>`;
    }).join('');
    // 버튼 표시/숨김
    document.getElementById('prevWeekBtn').style.display = currentWeekOffset > 0 ? '' : 'none';
    document.getElementById('nextWeekBtn').style.display = currentWeekOffset < MAX_WEEK_OFFSET ? '' : 'none';
}
window.addEventListener('DOMContentLoaded', renderWeekCalendar);

// 요일 클릭 시 모달 열기
function openWeekdayModal(idx) {
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    const modal = document.getElementById('weekdayModal');
    const title = document.getElementById('modalTitle');
    const input = document.getElementById('modalInput');
    modal.style.display = 'flex';
    title.textContent = `${weekDays[idx]}요일 메모`;
    input.value = '';
    input.placeholder = `(${weekDays[idx]}) 메모를 적어주세요`;
    input.setAttribute('data-idx', idx);
    setTimeout(() => input.focus(), 0);
}
function closeWeekdayModal() {
    document.getElementById('weekdayModal').style.display = 'none';
}
function saveWeekdayModal() {
    const input = document.getElementById('modalInput');
    const idx = Number(input.getAttribute('data-idx'));
    const text = input.value.trim();
    if (!text) return;
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    // 현재 보고 있는 주의 해당 요일 날짜 구하기
    const todayObj = new Date();
    const today = todayObj.getDay();
    const sunday = new Date(todayObj);
    sunday.setDate(todayObj.getDate() - today + currentWeekOffset * 7);
    const memoDate = new Date(sunday);
    memoDate.setDate(sunday.getDate() + idx);
    const dateStr = memoDate.toISOString().slice(0,10);
    const todo = {
        id: Date.now(),
        text: `(${weekDays[idx]}) ${text}`,
        completed: false,
        weekday: idx,
        dateStr: dateStr
    };
    todos.unshift(todo);
    saveTodos();
    displayTodos();
    renderWeekCalendar();
    closeWeekdayModal();
}
// 캘린더 클릭 이벤트 위임 (모달용)
window.addEventListener('DOMContentLoaded', function() {
    const calendar = document.getElementById('weekCalendar');
    calendar.addEventListener('click', function(e) {
        let target = e.target;
        while (target && !target.classList.contains('weekday')) {
            target = target.parentElement;
        }
        if (target && target.classList.contains('weekday')) {
            const idx = Number(target.getAttribute('data-idx'));
            openWeekdayModal(idx);
        }
    });
    // 모달 버튼 이벤트
    document.getElementById('modalSaveBtn').onclick = saveWeekdayModal;
    document.getElementById('modalCancelBtn').onclick = closeWeekdayModal;
    // 엔터키 입력
    document.getElementById('modalInput').onkeydown = function(e) {
        if (e.key === 'Enter') saveWeekdayModal();
    };
    // 모달 바깥 클릭 시 닫기
    document.getElementById('weekdayModal').onclick = function(e) {
        if (e.target === this) closeWeekdayModal();
    };
});

function addWeekdayMemo(inputElem) {
    const idx = Number(inputElem.getAttribute('data-idx'));
    const text = inputElem.value.trim();
    if (!text) return;
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    // 현재 보고 있는 주의 해당 요일 날짜 구하기
    const todayObj = new Date();
    const today = todayObj.getDay();
    const sunday = new Date(todayObj);
    sunday.setDate(todayObj.getDate() - today + currentWeekOffset * 7);
    const memoDate = new Date(sunday);
    memoDate.setDate(sunday.getDate() + idx);
    const dateStr = memoDate.toISOString().slice(0,10);
    const todo = {
        id: Date.now(),
        text: `(${weekDays[idx]}) ${text}`,
        completed: false,
        weekday: idx,
        dateStr: dateStr
    };
    todos.unshift(todo);
    saveTodos();
    displayTodos();
    weekEditingIdx = null;
    renderWeekCalendar();
}

// weekCalendar 슬라이드/버튼 이벤트
window.addEventListener('DOMContentLoaded', function() {
    const prevBtn = document.getElementById('prevWeekBtn');
    const nextBtn = document.getElementById('nextWeekBtn');
    prevBtn.onclick = function() {
        if(currentWeekOffset > 0) {
            currentWeekOffset--;
            weekEditingIdx = null;
            renderWeekCalendar();
        }
    };
    nextBtn.onclick = function() {
        if(currentWeekOffset < MAX_WEEK_OFFSET) {
            currentWeekOffset++;
            weekEditingIdx = null;
            renderWeekCalendar();
        }
    };
    // 마우스 드래그/터치 슬라이드 이벤트
    let startX = null;
    let dragging = false;
    const wrapper = document.getElementById('weekCalendarWrapper');
    // PC: 마우스
    wrapper.addEventListener('mousedown', function(e) {
        startX = e.clientX;
        dragging = true;
    });
    wrapper.addEventListener('mousemove', function(e) {
        if(!dragging) return;
        const diff = e.clientX - startX;
        if(Math.abs(diff) > 40) {
            if(diff > 0 && currentWeekOffset > 0) {
                currentWeekOffset--;
                weekEditingIdx = null;
                renderWeekCalendar();
            } else if(diff < 0 && currentWeekOffset < MAX_WEEK_OFFSET) {
                currentWeekOffset++;
                weekEditingIdx = null;
                renderWeekCalendar();
            }
            dragging = false;
        }
    });
    wrapper.addEventListener('mouseup', function(e) {
        dragging = false;
    });
    wrapper.addEventListener('mouseleave', function(e) {
        dragging = false;
    });
    // 모바일: 터치
    wrapper.addEventListener('touchstart', function(e) {
        if(e.touches.length === 1) startX = e.touches[0].clientX;
    });
    wrapper.addEventListener('touchmove', function(e) {
        if(startX === null) return;
        const diff = e.touches[0].clientX - startX;
        if(Math.abs(diff) > 40) {
            if(diff > 0 && currentWeekOffset > 0) {
                currentWeekOffset--;
                weekEditingIdx = null;
                renderWeekCalendar();
            } else if(diff < 0 && currentWeekOffset < MAX_WEEK_OFFSET) {
                currentWeekOffset++;
                weekEditingIdx = null;
                renderWeekCalendar();
            }
            startX = null;
        }
    });
    wrapper.addEventListener('touchend', function(e) {
        startX = null;
    });
});
