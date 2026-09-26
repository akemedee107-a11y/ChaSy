const DATABASE_URL = 'https://chasy-42ac3-default-rtdb.asia-southeast1.firebasedatabase.app';
const NAME_KEY = 'chasy-display-name';
const ROLE_KEY = 'chasy-support-role';

const roleSelect = document.querySelector('#roleSelect');
const connection = document.querySelector('#supportConnection');
const title = document.querySelector('#pageTitle');
const listView = document.querySelector('#ticketListView');
const newView = document.querySelector('#newTicketView');
const detailView = document.querySelector('#ticketDetailView');
const ticketList = document.querySelector('#ticketList');
const newButton = document.querySelector('#newTicketButton');
const listButton = document.querySelector('#ticketListButton');
const cancelButton = document.querySelector('#cancelTicketButton');
const backButton = document.querySelector('#backButton');
const ticketForm = document.querySelector('#ticketForm');
const customerName = document.querySelector('#customerName');
const category = document.querySelector('#category');
const subject = document.querySelector('#subject');
const description = document.querySelector('#description');
const ticketFormMessage = document.querySelector('#ticketFormMessage');
const detailNumber = document.querySelector('#detailNumber');
const detailSubject = document.querySelector('#detailSubject');
const detailMeta = document.querySelector('#detailMeta');
const statusSelect = document.querySelector('#statusSelect');
const ticketMessages = document.querySelector('#ticketMessages');
const replyForm = document.querySelector('#replyForm');
const replyName = document.querySelector('#replyName');
const replyInput = document.querySelector('#replyInput');
const replyMessage = document.querySelector('#replyMessage');

let tickets = [];
let selectedTicketId = null;
let activeFilter = 'all';

roleSelect.value = localStorage.getItem(ROLE_KEY) || 'customer';
customerName.value = localStorage.getItem(NAME_KEY) || '';
replyName.value = localStorage.getItem(NAME_KEY) || '';

function show(view) {
  [listView, newView, detailView].forEach((item) => item.classList.add('hidden'));
  view.classList.remove('hidden');
}

function statusClass(status) {
  return status === 'ปิดแล้ว' ? 'closed' : status === 'กำลังดำเนินการ' ? 'progress' : status === 'รอลูกค้าตอบ' ? 'waiting' : '';
}

function formatDate(value) {
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function normalizeTickets(data) {
  if (!data || typeof data !== 'object') return [];
  return Object.entries(data)
    .map(([id, ticket]) => ({ id, ...ticket }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

async function loadTickets() {
  const response = await fetch(`${DATABASE_URL}/tickets.json`);
  if (!response.ok) throw new Error('Cannot load tickets');
  tickets = normalizeTickets(await response.json());
  renderTickets();
  if (selectedTicketId) renderTicketDetail();
}

function renderTickets() {
  ticketList.replaceChildren();
  const visible = activeFilter === 'all' ? tickets : tickets.filter((ticket) => ticket.status === activeFilter);
  if (!visible.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-tickets';
    empty.textContent = activeFilter === 'all' ? 'ยังไม่มี Ticket — เริ่มเปิด Ticket แรกได้เลย' : 'ไม่พบ Ticket ในสถานะนี้';
    ticketList.append(empty);
    return;
  }

  visible.forEach((ticket) => {
    const card = document.createElement('button');
    card.className = 'ticket-card';
    card.type = 'button';
    const info = document.createElement('div');
    const number = document.createElement('span');
    number.className = 'ticket-number';
    number.textContent = ticket.ticketNumber;
    const heading = document.createElement('h3');
    heading.textContent = ticket.subject;
    const meta = document.createElement('p');
    meta.textContent = `${ticket.customerName} · ${ticket.category} · ${formatDate(ticket.createdAt)}`;
    const badge = document.createElement('span');
    badge.className = `status-badge ${statusClass(ticket.status)}`;
    badge.textContent = ticket.status;
    info.append(number, heading, meta);
    card.append(info, badge);
    card.addEventListener('click', () => openTicket(ticket.id));
    ticketList.append(card);
  });
}

function renderTicketDetail() {
  const ticket = tickets.find((item) => item.id === selectedTicketId);
  if (!ticket) return;
  detailNumber.textContent = ticket.ticketNumber;
  detailSubject.textContent = ticket.subject;
  detailMeta.textContent = `${ticket.customerName} · ${ticket.category} · ${formatDate(ticket.createdAt)}`;
  statusSelect.value = ticket.status;
  statusSelect.disabled = roleSelect.value !== 'agent';
  ticketMessages.replaceChildren();

  const messages = ticket.messages
    ? Object.entries(ticket.messages).map(([id, item]) => ({ id, ...item })).sort((a, b) => a.sentAt - b.sentAt)
    : [];
  messages.forEach((message) => {
    const row = document.createElement('div');
    row.className = `support-message ${message.role === 'agent' ? 'agent' : ''}`;
    const bubble = document.createElement('div');
    bubble.className = 'support-message-bubble';
    const name = document.createElement('strong');
    name.textContent = `${message.sender} · ${message.role === 'agent' ? 'เจ้าหน้าที่' : 'ลูกค้า'}`;
    const time = document.createElement('time');
    time.textContent = formatDate(message.sentAt);
    const text = document.createElement('p');
    text.textContent = message.text;
    bubble.append(name, time, text);
    row.append(bubble);
    ticketMessages.append(row);
  });
  ticketMessages.scrollTop = ticketMessages.scrollHeight;
}

function openList() {
  selectedTicketId = null;
  title.textContent = 'รายการ Ticket';
  newButton.classList.remove('hidden');
  show(listView);
}

function openNewTicket() {
  title.textContent = 'เปิด Ticket ใหม่';
  newButton.classList.add('hidden');
  show(newView);
}

function openTicket(id) {
  selectedTicketId = id;
  title.textContent = 'รายละเอียด Ticket';
  newButton.classList.add('hidden');
  show(detailView);
  renderTicketDetail();
}

ticketForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = customerName.value.trim();
  const issue = subject.value.trim();
  const detail = description.value.trim();
  if (!name || !issue || !detail) return;

  const submit = ticketForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  ticketFormMessage.textContent = 'กำลังเปิด Ticket...';
  const now = Date.now();
  const initialMessageId = `initial-${now}`;
  const payload = {
    ticketNumber: `CS-${String(now).slice(-6)}`,
    customerName: name.slice(0, 40),
    subject: issue.slice(0, 80),
    category: category.value,
    status: 'เปิดใหม่',
    createdAt: { '.sv': 'timestamp' },
    messages: {
      [initialMessageId]: { sender: name.slice(0, 40), role: 'customer', text: detail.slice(0, 1000), sentAt: { '.sv': 'timestamp' } },
    },
  };

  try {
    const response = await fetch(`${DATABASE_URL}/tickets.json`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Cannot create ticket');
    localStorage.setItem(NAME_KEY, name);
    ticketForm.reset();
    customerName.value = name;
    ticketFormMessage.textContent = '';
    openList();
  } catch {
    ticketFormMessage.textContent = 'เปิด Ticket ไม่สำเร็จ กรุณาลองใหม่';
  } finally {
    submit.disabled = false;
  }
});

replyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = replyName.value.trim();
  const text = replyInput.value.trim();
  if (!name || !text || !selectedTicketId) return;
  const submit = replyForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  replyMessage.textContent = 'กำลังส่ง...';
  try {
    const response = await fetch(`${DATABASE_URL}/tickets/${selectedTicketId}/messages.json`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: name.slice(0, 40), role: roleSelect.value, text: text.slice(0, 500), sentAt: { '.sv': 'timestamp' } }),
    });
    if (!response.ok) throw new Error('Cannot reply');
    localStorage.setItem(NAME_KEY, name);
    replyInput.value = '';
    replyMessage.textContent = 'ส่งแล้ว';
    replyMessage.classList.add('success');
  } catch {
    replyMessage.textContent = 'ส่งไม่สำเร็จ กรุณาลองใหม่';
  } finally {
    submit.disabled = false;
  }
});

statusSelect.addEventListener('change', async () => {
  if (roleSelect.value !== 'agent' || !selectedTicketId) return;
  await fetch(`${DATABASE_URL}/tickets/${selectedTicketId}/status.json`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(statusSelect.value),
  });
});

roleSelect.addEventListener('change', () => {
  localStorage.setItem(ROLE_KEY, roleSelect.value);
  renderTicketDetail();
});
document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  activeFilter = button.dataset.filter;
  renderTickets();
}));
newButton.addEventListener('click', openNewTicket);
cancelButton.addEventListener('click', openList);
backButton.addEventListener('click', openList);
listButton.addEventListener('click', openList);

const stream = new EventSource(`${DATABASE_URL}/tickets.json`);
stream.addEventListener('open', () => { connection.textContent = 'ออนไลน์ · Firebase real-time'; });
stream.addEventListener('put', loadTickets);
stream.addEventListener('patch', loadTickets);
stream.addEventListener('error', () => { connection.textContent = 'กำลังเชื่อมต่อใหม่...'; });

loadTickets().catch(() => {
  connection.textContent = 'เชื่อมต่อ Firebase ไม่สำเร็จ';
  ticketList.innerHTML = '<div class="empty-tickets">กรุณาตรวจสอบ Firebase Database Rules</div>';
});
