import fs from 'fs';

const base = 'C:/Users/gopik/AppData/Local/Temp/claude/e--1-Eonix-Solutions-3-Projects-Tamimah-App-Eonix-Academy-Web-App-For-Demo/71f498c6-a3d5-445b-870b-bf66efe1ca96/scratchpad/';
const data = JSON.parse(fs.readFileSync(`${base}mwasalat_demo_data.json`, 'utf8'));
const summary = JSON.parse(fs.readFileSync(`${base}mwasalat_demo_data_summary.json`, 'utf8'));
const staff = JSON.parse(fs.readFileSync(`${base}mwasalat_staff.json`, 'utf8'));
const admins = JSON.parse(fs.readFileSync(`${base}mwasalat_admins.json`, 'utf8'));

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const learners = summary.filter((l) => l.role === 'learner' || l.role === 'external_learner')
  .sort((a, b) => b.certCount - a.certCount || a.name.localeCompare(b.name));

function chipsFor(l) {
  const chips = [];
  if (l.certCount > 0) chips.push(`<span class="chip chip-good">${l.certCount} certificate${l.certCount > 1 ? 's' : ''}</span>`);
  if (l.hasFailThenPass) chips.push('<span class="chip chip-accent">quiz retake</span>');
  if (l.hasAssignment) chips.push('<span class="chip chip-accent">assignment</span>');
  if (l.hasPurchase) chips.push('<span class="chip chip-accent">purchase</span>');
  if (l.hasInProgress) chips.push('<span class="chip chip-warn">in progress</span>');
  if (l.enrollments.length === 0) chips.push('<span class="chip chip-muted">no activity</span>');
  return chips.join('');
}

const learnerRows = learners.map((l) => `
  <tr data-search="${esc(`${l.name} ${l.email} ${l.department ?? ''} ${l.role}`.toLowerCase())}">
    <td class="col-name">${esc(l.name)}</td>
    <td class="mono col-email"><button class="copy" data-copy="${esc(l.email)}">${esc(l.email)}</button></td>
    <td class="mono"><button class="copy" data-copy="${esc(l.password)}">${esc(l.password)}</button></td>
    <td>${l.role === 'external_learner' ? '<span class="tag tag-ext">External</span>' : '<span class="tag tag-int">Internal</span>'}</td>
    <td>${esc(l.department ?? '—')}</td>
    <td class="mono col-count">${l.enrollments.length}</td>
    <td class="chips">${chipsFor(l) || '<span class="chip chip-muted">no activity</span>'}</td>
  </tr>`).join('');

const staffByRole = { department_admin: [], instructor: [], supervisor: [] };
staff.forEach((s) => staffByRole[s.role].push(s));

function staffTable(rows, roleLabel) {
  return `
  <div class="staff-group">
    <h3>${roleLabel} <span class="count">(${rows.length})</span></h3>
    <div class="table-scroll">
    <table class="staff-table">
      <thead><tr><th>Name</th><th>Email</th><th>Password</th><th>Department</th></tr></thead>
      <tbody>
        ${rows.map((s) => `<tr>
          <td>${esc(s.name)}</td>
          <td class="mono"><button class="copy" data-copy="${esc(s.email)}">${esc(s.email)}</button></td>
          <td class="mono"><button class="copy" data-copy="${esc(s.password)}">${esc(s.password)}</button></td>
          <td>${esc(s.department ?? '—')}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    </div>
  </div>`;
}

const QUICK_PICKS = [
  {
    tag: 'Certificate showcase', color: 'good',
    name: 'Hamed Al-Balushi', email: 'hamed.albalushi@mwasalat.om', password: 'Learner@1234',
    why: 'Holds 3 certificates, including the mandatory "Defensive Driving &amp; Road Safety Fundamentals" — the cleanest first login to show a certificate in My Learning.',
  },
  {
    tag: 'Full modular journey', color: 'accent',
    name: 'Faisal Al-Siyabi', email: 'faisal.alsiyabi@mwasalat.om', password: 'Learner@1234',
    why: 'On "New Employee Induction": failed then passed <em>two</em> module quizzes, submitted and got a graded assignment, then earned the certificate — the whole modular-course story in one course.',
  },
  {
    tag: 'Top external learner', color: 'accent',
    name: 'Abdullah Al-Lawati', email: 'abdullah.allawati@yahoo.com', password: 'eLearner21234',
    why: '4 certificates and several real paid purchases — best account for the external/paid-learner experience end to end, including purchase history.',
  },
  {
    tag: 'Still in progress', color: 'warn',
    name: 'Salma Al-Kindi', email: 'salma.alkindi@mwasalat.om', password: 'Learner@1234',
    why: 'Enrolled in the mandatory "Defensive Driving" course but hasn\u2019t finished it yet — shows the "continue learning" / in-progress state, not just completions.',
  },
  {
    tag: 'Brand-new account', color: 'muted',
    name: 'Said Al-Rawahi', email: 'said.alrawahi@mwasalat.om', password: 'Learner@1234',
    why: 'Zero enrollments so far — use this one to demo browsing/enrolling in the course catalog from a completely empty state.',
  },
  {
    tag: 'Instructor view', color: 'accent',
    name: 'Rami Al-Kharusi', email: 'rami.alkharusi@mwasalat.om', password: 'Instructor@1234',
    why: 'Teaches "Defensive Driving" (learners already completed it) and "Public Transport Operator Licensing Renewal" — good for showing grading, completing a live class, and the instructor roster view.',
  },
];

const quickPickCards = QUICK_PICKS.map((p) => `
  <article class="pick pick-${p.color}">
    <span class="pick-tag">${esc(p.tag)}</span>
    <h3>${esc(p.name)}</h3>
    <div class="pick-creds">
      <button class="copy mono" data-copy="${esc(p.email)}">${esc(p.email)}</button>
      <button class="copy mono" data-copy="${esc(p.password)}">${esc(p.password)}</button>
    </div>
    <p>${p.why}</p>
  </article>`).join('');

const genDate = new Date().toISOString().slice(0, 10);
const totalCerts = data.certificates.length;
const totalEnroll = data.enrollments.length;
const totalTxn = data.transactions.length;
const totalRevenue = data.transactions.reduce((s, t) => s + t.amount, 0);

const html = `<title>Mwasalat Demo Roster</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
:root {
  --ink-900: #23181A; --ink-700: #4A3336; --ink-400: #8C6B6E; --ink-200: #D9C9CA; --ink-100: #F6EFEF;
  --red-700: #7A1420; --red-600: #9C1B29; --red-500: #C22033; --red-300: #E8929C; --red-100: #FBE7E9;
  --bg: #FBF8F6; --surface: #FFFFFF; --border: #EDE2E1;
  --text: var(--ink-900); --text-muted: var(--ink-400);
  --good: #1E7B4D; --good-bg: #E5F3EC;
  --warn: #A5690A; --warn-bg: #FBF0DC;
  --accent: var(--red-600); --accent-bg: var(--red-100);
  --shadow: 0 1px 2px rgba(35,24,26,0.06), 0 6px 20px rgba(35,24,26,0.05);
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1B1315; --surface: #241A1C; --border: #3A2A2C;
    --text: #F3E9E9; --text-muted: #B9A4A5;
    --good: #6FCF9A; --good-bg: #1E3328;
    --warn: #E3A845; --warn-bg: #3A2E15;
    --accent: #E8929C; --accent-bg: #3A1D22;
    --shadow: 0 1px 2px rgba(0,0,0,0.3), 0 6px 24px rgba(0,0,0,0.35);
  }
}
:root[data-theme="dark"] {
  --bg: #1B1315; --surface: #241A1C; --border: #3A2A2C;
  --text: #F3E9E9; --text-muted: #B9A4A5;
  --good: #6FCF9A; --good-bg: #1E3328;
  --warn: #E3A845; --warn-bg: #3A2E15;
  --accent: #E8929C; --accent-bg: #3A1D22;
  --shadow: 0 1px 2px rgba(0,0,0,0.3), 0 6px 24px rgba(0,0,0,0.35);
}
:root[data-theme="light"] {
  --bg: #FBF8F6; --surface: #FFFFFF; --border: #EDE2E1;
  --text: var(--ink-900); --text-muted: var(--ink-400);
  --good: #1E7B4D; --good-bg: #E5F3EC;
  --warn: #A5690A; --warn-bg: #FBF0DC;
  --accent: var(--red-600); --accent-bg: var(--red-100);
  --shadow: 0 1px 2px rgba(35,24,26,0.06), 0 6px 20px rgba(35,24,26,0.05);
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--bg); color: var(--text);
  font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.5;
}
.mono { font-family: "SF Mono", "Cascadia Code", Consolas, "Liberation Mono", monospace; font-variant-numeric: tabular-nums; font-size: 0.85em; }
.wrap { max-width: 1180px; margin: 0 auto; padding: 40px 24px 80px; }
header.page-head { margin-bottom: 32px; }
header.page-head h1 {
  margin: 0 0 6px; font-size: 1.9rem; font-weight: 800; letter-spacing: -0.01em; text-wrap: balance;
  color: var(--ink-900);
}
:root[data-theme="dark"] header.page-head h1, @media (prefers-color-scheme: dark) { }
header.page-head p { margin: 0; color: var(--text-muted); font-size: 0.95rem; }
.stat-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }
.stat {
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
  padding: 10px 16px; box-shadow: var(--shadow);
}
.stat b { display: block; font-size: 1.2rem; font-family: "SF Mono", Consolas, monospace; font-variant-numeric: tabular-nums; color: var(--accent); }
.stat span { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }

section { margin-bottom: 44px; }
h2 {
  font-size: 1.05rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--text-muted); margin: 0 0 16px; padding-bottom: 10px; border-bottom: 1px solid var(--border);
}

.picks-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
.pick {
  background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 18px;
  box-shadow: var(--shadow); position: relative; overflow: hidden;
}
.pick::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 4px; background: var(--pick-color, var(--accent)); }
.pick-good { --pick-color: var(--good); } .pick-accent { --pick-color: var(--accent); }
.pick-warn { --pick-color: var(--warn); } .pick-muted { --pick-color: var(--ink-200); }
.pick-tag {
  display: inline-block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--pick-color, var(--accent)); margin-bottom: 8px;
}
.pick h3 { margin: 0 0 10px; font-size: 1.05rem; font-weight: 700; }
.pick-creds { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.pick p { margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.55; }
.pick p em { color: var(--text); font-style: normal; font-weight: 600; }

button.copy {
  font: inherit; background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
  padding: 5px 9px; text-align: left; color: var(--text); cursor: pointer; width: 100%;
  transition: background 0.12s, border-color 0.12s;
}
button.copy:hover { border-color: var(--accent); background: var(--accent-bg); }
button.copy:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
button.copy.copied::after { content: " ✓ copied"; color: var(--good); font-weight: 600; }

.search-bar { margin-bottom: 14px; }
.search-bar input {
  width: 100%; max-width: 420px; font: inherit; padding: 10px 14px; border-radius: 10px;
  border: 1px solid var(--border); background: var(--surface); color: var(--text);
}
.search-bar input:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.search-bar input::placeholder { color: var(--text-muted); }

.table-scroll { overflow-x: auto; border: 1px solid var(--border); border-radius: 14px; background: var(--surface); box-shadow: var(--shadow); }
table { border-collapse: collapse; width: 100%; font-size: 0.87rem; }
thead th {
  text-align: left; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);
  padding: 10px 14px; border-bottom: 1px solid var(--border); white-space: nowrap; position: sticky; top: 0; background: var(--surface);
}
tbody td { padding: 9px 14px; border-bottom: 1px solid var(--border); vertical-align: middle; white-space: nowrap; }
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover { background: var(--bg); }
.col-name { font-weight: 600; }
.col-count { text-align: center; }

.tag { font-size: 0.72rem; padding: 2px 8px; border-radius: 999px; font-weight: 600; }
.tag-int { background: var(--accent-bg); color: var(--accent); }
.tag-ext { background: var(--warn-bg); color: var(--warn); }

.chips { white-space: normal; }
.chip { display: inline-block; font-size: 0.7rem; font-weight: 600; padding: 2px 8px; border-radius: 999px; margin: 1px 3px 1px 0; }
.chip-good { background: var(--good-bg); color: var(--good); }
.chip-warn { background: var(--warn-bg); color: var(--warn); }
.chip-accent { background: var(--accent-bg); color: var(--accent); }
.chip-muted { background: var(--ink-100); color: var(--text-muted); }
:root[data-theme="dark"] .chip-muted { background: var(--border); }

.staff-group { margin-bottom: 24px; }
.staff-group h3 { font-size: 0.95rem; margin: 0 0 8px; }
.staff-group .count { color: var(--text-muted); font-weight: 400; font-size: 0.85rem; }
.staff-table th, .staff-table td { white-space: nowrap; }

.admin-note {
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 18px;
  font-size: 0.85rem; color: var(--text-muted);
}
.admin-note b { color: var(--text); }

footer { color: var(--text-muted); font-size: 0.8rem; text-align: center; margin-top: 40px; }
</style>

<div class="wrap">
  <header class="page-head">
    <h1>Mwasalat Demo Roster</h1>
    <p>Every seeded account, its login, and what it's good for — generated ${genDate} from the current database.</p>
    <div class="stat-row">
      <div class="stat"><b>${learners.length}</b><span>Learners</span></div>
      <div class="stat"><b>${staff.length + admins.length}</b><span>Staff accounts</span></div>
      <div class="stat"><b>${totalEnroll}</b><span>Enrollments</span></div>
      <div class="stat"><b>${totalCerts}</b><span>Certificates</span></div>
      <div class="stat"><b>${totalTxn}</b><span>Purchases (${totalRevenue} OMR)</span></div>
    </div>
  </header>

  <section>
    <h2>Quick picks for the demo</h2>
    <div class="picks-grid">
      ${quickPickCards}
    </div>
  </section>

  <section>
    <h2>Admin accounts</h2>
    <div class="admin-note">
      <b>Super Admin</b> — admin@mwasalat.om &nbsp;·&nbsp; <b>Platform Admin</b> — gopikadeepak45@gmail.com (your own account, password not tracked here)
    </div>
  </section>

  <section>
    <h2>Staff credentials</h2>
    ${staffTable(staffByRole.department_admin, 'Department Admins')}
    ${staffTable(staffByRole.instructor, 'Instructors')}
    ${staffTable(staffByRole.supervisor, 'Supervisors')}
  </section>

  <section>
    <h2>Full learner roster</h2>
    <div class="search-bar">
      <input type="text" id="search" placeholder="Search by name, email, or department…" autocomplete="off" />
    </div>
    <div class="table-scroll">
      <table id="learner-table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Password</th><th>Type</th><th>Department</th><th>Courses</th><th>Highlights</th></tr>
        </thead>
        <tbody>${learnerRows}</tbody>
      </table>
    </div>
  </section>

  <footer>Passwords are shared per-role demo credentials, not per-account secrets — fine to reuse across this roster.</footer>
</div>

<script>
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.copy');
  if (!btn) return;
  navigator.clipboard?.writeText(btn.dataset.copy).then(() => {
    btn.classList.add('copied');
    setTimeout(() => btn.classList.remove('copied'), 1200);
  });
});

const searchInput = document.getElementById('search');
const rows = Array.from(document.querySelectorAll('#learner-table tbody tr'));
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  rows.forEach((r) => {
    r.style.display = !q || r.dataset.search.includes(q) ? '' : 'none';
  });
});
</script>
`;

fs.writeFileSync(`${base}mwasalat_demo_roster.html`, html);
console.log('Written:', `${base}mwasalat_demo_roster.html`, `(${html.length} bytes)`);
