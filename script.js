// 할 일 데이터를 저장할 배열
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let editingId = null;

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
};

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
}

// 모든 할 일 삭제 함수
function clearAll() {
    if (confirm('모든 할 일을 삭제하시겠습니까?')) {
        todos = [];
        saveTodos();
        displayTodos();
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
    todos.forEach(todo => {
        const item = document.createElement('div');
        item.className = 'todo-item' + (todo.completed ? ' completed' : '');
        if (editingId === todo.id) {
            item.innerHTML = `
                <button class=\"check-btn\" disabled>${todo.completed ? '✔️' : '☑️'}</button>
                <input type=\"text\" id=\"editInput_${todo.id}\" value=\"${todo.text.replace(/"/g, '&quot;')}\" class=\"edit-input\" />
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