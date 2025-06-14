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
    // 메모 개수 표시 추가
    const memoCount = todos.length;
    const dateTimeStr = `${year}-${month}-${day}-${weekday}-${hours}:${minutes}:${seconds}  (${memoCount})`;
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
        // 모바일 PWA에서 입력창 터치 시 키보드가 잘 뜨도록 여러 번 focus 시도
        input.addEventListener('touchend', function() {
            setTimeout(() => input.focus(), 0);
            setTimeout(() => input.focus(), 100);
            setTimeout(() => input.focus(), 200);
        });
        input.addEventListener('click', function() {
            setTimeout(() => input.focus(), 0);
            setTimeout(() => input.focus(), 100);
            setTimeout(() => input.focus(), 200);
        });
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
    setTimeout(() => input.focus(), 0);
    setTimeout(() => input.focus(), 100);
    setTimeout(() => input.focus(), 200);
    renderWeekCalendar();
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
    const todayObj = new Date();
    const todayStr = todayObj.toISOString().slice(0,10);
    // 오늘 날짜 메모, 일반 메모, 지난 요일 메모로 분리
    const todayMemos = [];
    const normalMemos = [];
    const pastMemos = [];
    todos.forEach(todo => {
        if (todo.dateStr === todayStr) {
                todayMemos.push(todo);
        } else if (typeof todo.weekday === 'number') {
                pastMemos.push(todo);
        } else {
            normalMemos.push(todo);
        }
    });
    // 지난 요일 메모를 오늘에 가까운 순서로 정렬 (요일 정보가 있는 경우만)
    const today = todayObj.getDay();
    pastMemos.sort((a, b) => {
        let diffA = (a.weekday - today + 7) % 7;
        let diffB = (b.weekday - today + 7) % 7;
        return diffA - diffB;
    });
    // 오늘 날짜 메모 → 일반 메모 → 지난 요일 메모 순서로 표시
    todayMemos.sort((a, b) => {
        // id는 Date.now()로 생성되므로, id가 더 크면 더 늦게 입력된 메모임
        // 하지만 dateStr이 같으므로, id 기준으로 오름차순(오래된 것부터) 정렬
        return a.id - b.id;
    });
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
    // 복사한 시간 구하기
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[now.getDay()];
    const copyTime = `${year}-${month}-${day}-${weekday}-${hours}:${minutes}:${seconds}`;
    // 멋진 구절 가져오기
    const phrase = localStorage.getItem('memo_phrase') || '';
    // displayTodos와 동일한 순서로 정렬
    const today = new Date().getDay();
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
    pastMemos.sort((a, b) => {
        let diffA = (a.weekday - today + 7) % 7;
        let diffB = (b.weekday - today + 7) % 7;
        return diffA - diffB;
    });
    const ordered = [...todayMemos, ...normalMemos, ...pastMemos];
    const allText = ordered.map(todo => todo.text).join('\n');
    // 최종 복사 텍스트 조합
    let copyText = `${copyTime}`;
    if (phrase) {
        copyText += `\n(${phrase})`;
    }
    if (allText) {
        copyText += `\n${allText}`;
    }
    // 임시 textarea 생성
    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = copyText;
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    try {
        document.execCommand('copy');
        alert('모든 메모와 멋진 구절이 복사되었습니다!');
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
            <div class=\"phrase-box\">\n                <span class=\"phrase-text\" id=\"phraseText\">${savedPhrase}</span>\n            </div>\n        `;
        setTimeout(() => {
            const text = document.getElementById('phraseText');
            if(text) {
                let lastTap = 0;
                text.addEventListener('dblclick', openPhraseModal);
                text.addEventListener('touchend', function(e) {
                    const now = Date.now();
                    if (now - lastTap < 400) {
                        openPhraseModal();
                        lastTap = 0;
                    } else {
                        lastTap = now;
                    }
                });
            }
        }, 0);
    } else {
        area.innerHTML = `
            <form class=\"phrase-box\" onsubmit=\"savePhrase(event)\">\n                <input type=\"text\" class=\"phrase-input\" id=\"phraseInput\" placeholder=\"멋진 구절을 입력하세요\">\n                <button class=\"phrase-save-btn\" type=\"submit\">저장</button>\n            </form>\n        `;
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
    // e가 있을 때만 preventDefault (form submit), 없으면 무시
    if (e && e.preventDefault) e.preventDefault();
    // phraseInput(최초 입력) 또는 phraseModalInput(수정)에서 값 가져오기
    const input = document.getElementById('phraseInput') || document.getElementById('phraseModalInput');
    const value = input.value.trim();
    if (!value) {
        alert('멋진 문구는 비워둘 수 없습니다!');
        return;
    }
    localStorage.setItem('memo_phrase', value);
    renderPhraseArea();
    closePhraseModal(); // 모달이 열려있으면 닫기
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
    const weekDateStrs = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        weekDates.push(('0' + d.getDate()).slice(-2));
        weekDateObjs.push(new Date(d));
        weekDateStrs.push(d.toISOString().slice(0,10));
    }
    // 요일별 해당 날짜에 입력된 메모 개수 계산 (최대 3개)
    const counts = [0,0,0,0,0,0,0];
    todos.forEach(todo => {
        if (typeof todo.weekday === 'number' && todo.dateStr) {
            for (let i = 0; i < 7; i++) {
                // 메모의 날짜와 weekDateStrs[i]가 같고, 요일도 같아야 함
                if (todo.weekday === i && todo.dateStr === weekDateStrs[i]) {
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
    // 슬라이드 후 항상 transform을 0으로 초기화
    calendar.style.transform = 'translateX(0)';
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
    let startX = null;
    let dragging = false;
    let lastDiff = 0;
    const wrapper = document.getElementById('weekCalendarWrapper');
    const calendar = document.getElementById('weekCalendar');
    // PC: 마우스
    wrapper.addEventListener('mousedown', function(e) {
        startX = e.clientX;
        dragging = true;
        lastDiff = 0;
        calendar.style.transition = 'none';
    });
    wrapper.addEventListener('mousemove', function(e) {
        if(!dragging) return;
        const diff = e.clientX - startX;
        lastDiff = diff;
        calendar.style.transform = `translateX(${diff}px)`;
    });
    // mouseup을 window에 등록하여 캘린더 영역 밖에서도 동작
    window.addEventListener('mouseup', function(e) {
        if(!dragging) return;
        dragging = false;
        calendar.style.transition = 'transform 0.25s cubic-bezier(0.4,0.2,0.2,1)';
        if(Math.abs(lastDiff) > 40) {
            // 방향 조건: 왼쪽(음수) → 다음주, 오른쪽(양수) → 이전주
            if(lastDiff < 0 && currentWeekOffset < MAX_WEEK_OFFSET) {
                calendar.style.transform = 'translateX(-100vw)';
                setTimeout(() => {
                    currentWeekOffset++;
                    weekEditingIdx = null;
                    renderWeekCalendar();
                    calendar.style.transition = 'none';
                    calendar.style.transform = 'translateX(100vw)';
                    setTimeout(() => {
                        calendar.style.transition = 'transform 0.25s cubic-bezier(0.4,0.2,0.2,1)';
                        calendar.style.transform = 'translateX(0)';
                    }, 10);
                }, 250);
            } else if(lastDiff > 0 && currentWeekOffset > 0) {
                calendar.style.transform = 'translateX(100vw)';
                setTimeout(() => {
                    currentWeekOffset--;
                    weekEditingIdx = null;
                    renderWeekCalendar();
                    calendar.style.transition = 'none';
                    calendar.style.transform = 'translateX(-100vw)';
                    setTimeout(() => {
                        calendar.style.transition = 'transform 0.25s cubic-bezier(0.4,0.2,0.2,1)';
                        calendar.style.transform = 'translateX(0)';
                    }, 10);
                }, 250);
            } else {
                calendar.style.transform = 'translateX(0)';
            }
        } else {
            calendar.style.transform = 'translateX(0)';
        }
    });
    wrapper.addEventListener('mouseleave', function(e) {
        if(dragging) {
            dragging = false;
            calendar.style.transition = 'transform 0.25s cubic-bezier(0.4,0.2,0.2,1)';
            calendar.style.transform = 'translateX(0)';
        }
    });
    // 모바일: 터치
    wrapper.addEventListener('touchstart', function(e) {
        if(e.touches.length === 1) {
            startX = e.touches[0].clientX;
            lastDiff = 0;
            calendar.style.transition = 'none';
        }
    });
    wrapper.addEventListener('touchmove', function(e) {
        if(startX === null) return;
        const diff = e.touches[0].clientX - startX;
        lastDiff = diff;
        calendar.style.transform = `translateX(${diff}px)`;
    });
    wrapper.addEventListener('touchend', function(e) {
        calendar.style.transition = 'transform 0.25s cubic-bezier(0.4,0.2,0.2,1)';
        if(Math.abs(lastDiff) > 40) {
            if(lastDiff < 0 && currentWeekOffset < MAX_WEEK_OFFSET) {
                calendar.style.transform = 'translateX(-100vw)';
                setTimeout(() => {
                    currentWeekOffset++;
                    weekEditingIdx = null;
                    renderWeekCalendar();
                    calendar.style.transition = 'none';
                    calendar.style.transform = 'translateX(100vw)';
                    setTimeout(() => {
                        calendar.style.transition = 'transform 0.25s cubic-bezier(0.4,0.2,0.2,1)';
                        calendar.style.transform = 'translateX(0)';
                    }, 10);
                }, 250);
            } else if(lastDiff > 0 && currentWeekOffset > 0) {
                calendar.style.transform = 'translateX(100vw)';
                setTimeout(() => {
                    currentWeekOffset--;
                    weekEditingIdx = null;
                    renderWeekCalendar();
                    calendar.style.transition = 'none';
                    calendar.style.transform = 'translateX(-100vw)';
                    setTimeout(() => {
                        calendar.style.transition = 'transform 0.25s cubic-bezier(0.4,0.2,0.2,1)';
                        calendar.style.transform = 'translateX(0)';
                    }, 10);
                }, 250);
            } else {
                calendar.style.transform = 'translateX(0)';
            }
        } else {
            calendar.style.transform = 'translateX(0)';
        }
        startX = null;
    });
});
