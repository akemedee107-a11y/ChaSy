const STORAGE_KEY = 'chasy-messages-v1';
const COLORS = {
  'ปริม': 'pink',
  'บีม': 'blue',
  'นนท์': 'amber',
};

const form = document.querySelector('#messageForm');
const input = document.querySelector('#messageInput');
const sender = document.querySelector('#senderSelect');
const messageList = document.querySelector('#messageList');
const clearButton = document.querySelector('#clearButton');
const emptyTemplate = document.querySelector('#emptyStateTemplate');

let messages = loadMessages();

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

function renderMessages() {
  messageList.replaceChildren();

  if (messages.length === 0) {
    messageList.append(emptyTemplate.content.cloneNode(true));
    return;
  }

  messages.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'message';

    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${COLORS[item.sender] || 'blue'}`;
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
  if (!text) return;

  messages.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    sender: sender.value,
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
