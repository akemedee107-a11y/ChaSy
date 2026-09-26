const DATABASE_URL = 'https://chasy-42ac3-default-rtdb.asia-southeast1.firebasedatabase.app';
const NAME_KEY = 'chasy-display-name';
const COLOR_CLASSES = ['pink', 'blue', 'amber'];

const form = document.querySelector('#messageForm');
const input = document.querySelector('#messageInput');
const senderInput = document.querySelector('#senderInput');
const sendButton = form.querySelector('button[type="submit"]');
const messageList = document.querySelector('#messageList');
const clearButton = document.querySelector('#clearButton');
const emptyTemplate = document.querySelector('#emptyStateTemplate');
const peopleList = document.querySelector('#peopleList');
const peopleCount = document.querySelector('#peopleCount');
const formMessage = document.querySelector('#formMessage');
const connectionStatus = document.querySelector('#connectionStatus');

let messages = [];
senderInput.value = localStorage.getItem(NAME_KEY) || '';

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

function normalizeMessages(data) {
  if (!data || typeof data !== 'object') return [];
  return Object.entries(data)
    .map(([id, item]) => ({ id, ...item }))
    .filter((item) => item.sender && item.text && item.sentAt)
    .sort((first, second) => first.sentAt - second.sentAt)
    .slice(-100);
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
    time.dateTime = new Date(item.sentAt).toISOString();
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

async function loadMessages() {
  const response = await fetch(`${DATABASE_URL}/messages.json`);
  if (!response.ok) throw new Error('Cannot read messages');
  messages = normalizeMessages(await response.json());
  renderMessages();
}

function connectRealtime() {
  const stream = new EventSource(`${DATABASE_URL}/messages.json`);

  stream.addEventListener('open', () => {
    connectionStatus.textContent = 'ออนไลน์ — ข้อความอัปเดตแบบ real-time';
    connectionStatus.classList.add('connected');
  });

  const refresh = async () => {
    try {
      await loadMessages();
    } catch {
      connectionStatus.textContent = 'เชื่อมต่อไม่ได้ กรุณารีเฟรชหน้า';
      connectionStatus.classList.remove('connected');
    }
  };

  stream.addEventListener('put', refresh);
  stream.addEventListener('patch', refresh);
  stream.addEventListener('error', () => {
    connectionStatus.textContent = 'กำลังเชื่อมต่อใหม่...';
    connectionStatus.classList.remove('connected');
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  const sender = senderInput.value.trim();

  if (!sender) {
    formMessage.textContent = 'กรุณากรอกชื่อผู้ส่งก่อน';
    senderInput.focus();
    return;
  }
  if (!text) {
    formMessage.textContent = 'กรุณาพิมพ์ข้อความก่อนกดส่ง';
    input.focus();
    return;
  }

  localStorage.setItem(NAME_KEY, sender);
  sendButton.disabled = true;
  formMessage.textContent = 'กำลังส่ง...';
  formMessage.classList.remove('success');

  try {
    const response = await fetch(`${DATABASE_URL}/messages.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: sender.slice(0, 30),
        text: text.slice(0, 300),
        sentAt: { '.sv': 'timestamp' },
      }),
    });
    if (!response.ok) throw new Error('Cannot send message');
    input.value = '';
    formMessage.textContent = 'ส่งข้อความแล้ว';
    formMessage.classList.add('success');
    input.focus();
  } catch {
    formMessage.textContent = 'ส่งไม่สำเร็จ กรุณาตรวจการเชื่อมต่อแล้วลองใหม่';
  } finally {
    sendButton.disabled = false;
  }
});

clearButton.addEventListener('click', async () => {
  if (!messages.length || !window.confirm('ต้องการล้างข้อความทั้งหมดใช่ไหม?')) return;
  try {
    const response = await fetch(`${DATABASE_URL}/messages.json`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Cannot clear messages');
  } catch {
    formMessage.textContent = 'ล้างข้อความไม่สำเร็จ';
  }
});

senderInput.addEventListener('input', () => {
  formMessage.textContent = '';
  formMessage.classList.remove('success');
});

input.addEventListener('input', () => {
  formMessage.textContent = '';
  formMessage.classList.remove('success');
});

loadMessages()
  .then(connectRealtime)
  .catch(() => {
    connectionStatus.textContent = 'เชื่อมต่อ Firebase ไม่สำเร็จ';
    formMessage.textContent = 'กรุณาตรวจสอบ Firebase Database Rules';
  });
