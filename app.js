const STORAGE_KEY = 'chasy-messages-v1';
const NAME_KEY = 'chasy-display-name';
const COLOR_CLASSES = ['pink', 'blue', 'amber'];

const form = document.querySelector('#messageForm');
const input = document.querySelector('#messageInput');
const senderInput = document.querySelector('#senderInput');
const messageList = document.querySelector('#messageList');
const clearButton = document.querySelector('#clearButton');
const emptyTemplate = document.querySelector('#emptyStateTemplate');
const peopleList = document.querySelector('#peopleList');
const peopleCount = document.querySelector('#peopleCount');

let messages = loadMessages();
senderInput.value = localStorage.getItem(NAME_KEY) || '';

function loadMessages() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveMessages() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

function formatTime(value) {
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function colorFor(name) {
  const value = [...name].reduce((sum, character) => sum + character.codePointAt(0), 0);
  return COLOR_CLASSES[value % COLOR_CLASSES.length];
}

function renderPeople() {
  const names = [...new Set(messages.map((item) => item.sender))];
  peopleCount.textContent = String(names.length);
  peopleList.replaceChildren();

  if (names.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'person';
    empty.textContent = 'ยังไม่มีสมาชิก';
    peopleList.append(empty);
    return;
  }

  names.forEach((name) => {
    const person = document.createElement('div');
    person.className = 'person';
    const avatar = document.createElement('span');
    avatar.className = `avatar ${colorFor(name)}`;
    avatar.textContent = name.slice(0, 1);
    const status = document.createElement('span');
    status.className = 'status';
    person.append(avatar, status, document.createTextNode(name));
    peopleList.append(person);
  });
}

function renderMessages() {
  messageList.replaceChildren();
  renderPeople();

  if (messages.length === 0) {
    messageList.append(emptyTemplate.content.cloneNode(true));
    return;
  }

  messages.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'message';

    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${colorFor(item.sender)}`;
    avatar.textContent = item.sender.slice(0, 1);

    const content = document.createElement('div');
    const heading = document.createElement('div');
    heading.className = 'message-heading';

    const name = document.createElement('strong');
    name.textContent = item.sender;
    const time = document.createElement('time');
    time.dateTime = item.sentAt;
    time.textContent = formatTime(item.sentAt);
    const text = document.createElement('p');
    text.textContent = item.text;

    heading.append(name, time);
    content.append(heading, text);
    article.append(avatar, content);
    messageList.append(article);
  });

  messageList.scrollTop = messageList.scrollHeight;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();
  const sender = senderInput.value.trim();
  if (!text || !sender) {
    if (!sender) senderInput.focus();
    return;
  }

  localStorage.setItem(NAME_KEY, sender);

  messages.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    sender,
    text,
    sentAt: new Date().toISOString(),
  });
  messages = messages.slice(-100);
  saveMessages();
  renderMessages();
  input.value = '';
  input.focus();
});

clearButton.addEventListener('click', () => {
  if (!messages.length || !window.confirm('ต้องการล้างข้อความทั้งหมดใช่ไหม?')) return;
  messages = [];
  localStorage.removeItem(STORAGE_KEY);
  renderMessages();
});

window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) {
    messages = loadMessages();
    renderMessages();
  }
});

renderMessages();
