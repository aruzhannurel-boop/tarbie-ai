'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BrainCircuit, CalendarDays, ChartNoAxesCombined,
  Lightbulb, FileText, Play, Download, Copy,
  RotateCcw, ArrowRight, Sparkles, ShieldCheck,
  Menu, CheckCircle2
} from 'lucide-react';

const modules = [
  {
    id: 'advisor',
    title: 'AI тәрбие кеңесшісі',
    short: 'Жағдаяттарды педагогикалық талдау',
    icon: BrainCircuit,
    placeholder: 'Мысалы: 7-сыныпта екі оқушы арасында жанжал туындады. Не істеуге болады?',
    example: '7-сыныпта екі оқушы арасында жанжал туындады. Сыныпта достық қарым-қатынасты қалпына келтіру үшін қандай жұмыс ұйымдастыруға болады?'
  },
  {
    id: 'planner',
    title: 'AI жоспарлаушы',
    short: 'Тәрбие сағатының шығармашылық жоспары',
    icon: CalendarDays,
    placeholder: 'Сынып, тақырып, мақсат, уақыт және форматты жазыңыз...',
    example: '7-сынып. Тақырып: Достық пен сыйластық. 40 минут. Топтық және жұптық жұмыс, өмірлік жағдаяттар, рефлексия.'
  },
  {
    id: 'analytics',
    title: 'AI талдаушы',
    short: 'Нақты деректер бойынша қорытынды',
    icon: ChartNoAxesCombined,
    placeholder: 'Өткізілген шара саны, қатысушылар және кері байланыс нәтижелерін енгізіңіз...',
    example: 'ДЕМОНСТРАЦИЯЛЫҚ ДЕРЕКТЕР: Қазан айында 12 іс-шара өтті, 280 оқушы қатысты, 46 ата-ана қатысты. 80 оқушының кері байланысы жиналды: 62 оң, 12 бейтарап, 6 теріс. Талдау жаса.'
  },
  {
    id: 'ideas',
    title: 'AI идея генераторы',
    short: 'Тәрбиелік бастамалар мен акциялар',
    icon: Lightbulb,
    placeholder: 'Тәрбие бағыты, сынып және мақсаты...',
    example: '7-сыныпқа арналған экология және мейірімділік бағытындағы мектепішілік акцияларға 3 ерекше идея ұсын.'
  },
  {
    id: 'reports',
    title: 'AI есеп көмекшісі',
    short: 'Айлық, тоқсандық және жылдық есеп',
    icon: FileText,
    placeholder: 'Есеп кезеңі және нақты өткізілген жұмыстарды енгізіңіз...',
    example: 'ДЕМОНСТРАЦИЯЛЫҚ ДЕРЕКТЕР: Қазан айы, 5 экологиялық акция, 3 кітап оқу шарасы, 2 ата-аналар кездесуі. Қатысушылар саны туралы ақпарат жоқ. Осы деректер бойынша ресми есеп жобасын жаса.'
  }
];

const demo = ['advisor', 'planner', 'analytics'];

function saveBlob(name, content, type) {
  const anchor = document.createElement('a');
  const url = URL.createObjectURL(new Blob([content], { type }));
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function esc(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}


const storageKey = 'tarbie-ai-responses-v1';
const sectionTemplates = {
  advisor: 'Жағдайды түсіну; Мақсат; Әрекет жоспары; Дайын сөз үлгісі; Күтілетін нәтиже',
  planner: 'Тақырып және мақсат; Құралдар; Сабақ кезеңдері; Рефлексия; Күтілетін нәтиже',
  analytics: 'Берілген деректер; Негізгі байқаулар; Қорытынды; Ұсыныстар; Жетіспейтін мәліметтер',
  ideas: 'Бірінші идея; Екінші идея; Үшінші идея; Іске асыру қадамдары',
  reports: 'Есеп кезеңі; Атқарылған жұмыс; Нәтижелер; Қиындықтар; Келесі міндеттер'
};
const starterTopics = {
  advisor: ['Оқушылар арасындағы жанжал', 'Ата-анамен байланыс', 'Сыныптағы ынтымақтастық'],
  planner: ['Достық пен сыйластық', 'Адалдық және жауапкершілік', 'Қауіпсіз интернет'],
  analytics: ['Қатысу көрсеткіштерін талдау', 'Кері байланысты талдау', 'Айлық жұмысты салыстыру'],
  ideas: ['Мейірімділік апталығы', 'Экологиялық акция', 'Кітап оқу челленджі'],
  reports: ['Айлық тәрбие жұмысы', 'Іс-шара қорытындысы', 'Ата-аналар жиналысы']
};

function plainText(text) {
  return text.replace(/^#{1,6}\s+/gm, '').replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1').replace(/\x60([^\x60]+)\x60/g, '$1');
}

function inlineText(text) {
  return text.split(/(\*\*.*?\*\*|\*[^*]+\*|\x60[^\x60]+\x60)/g).map((part, index) => {
    if (part.startsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith('\x60')) return <code key={index}>{part.slice(1, -1)}</code>;
    return part;
  });
}

function answerSections(text) {
  const sections = [];
  let current = { title: '', lines: [] };
  for (const line of text.split('\n')) {
    const heading = line.trim().match(/^#{1,6}\s+(.+)$/) ||
      line.trim().match(/^\*\*(.+?)\*\*\s*:?\s*$/);
    if (heading) {
      if (current.title || current.lines.some(value => value.trim())) sections.push(current);
      current = { title: plainText(heading[1]).replace(/:$/, ''), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.title || current.lines.some(value => value.trim())) sections.push(current);
  return sections;
}

function RichLines({ lines }) {
  const blocks = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim();
    if (!line || /^[-*_]{3,}$/.test(line)) { index++; continue; }
    if (line.includes('|') && /^\s*\|?\s*:?-{3}/.test(lines[index + 1] || '')) {
      const cells = value => value.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
      const headers = cells(line);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].includes('|')) rows.push(cells(lines[index++]));
      blocks.push(<div className="ta-table" key={index}><table><thead><tr>{headers.map((cell, i) => <th key={i}>{inlineText(cell)}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{headers.map((_, j) => <td key={j}>{inlineText(row[j] || '')}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    const ordered = /^\d+[.)]\s+/.test(line);
    const bullet = /^[-*+]\s+/.test(line);
    if (ordered || bullet) {
      const pattern = ordered ? /^\d+[.)]\s+/ : /^[-*+]\s+/;
      const items = [];
      const start = ordered ? parseInt(line, 10) : undefined;
      while (index < lines.length && pattern.test(lines[index].trim())) {
        items.push(lines[index++].trim().replace(pattern, ''));
      }
      const List = ordered ? 'ol' : 'ul';
      blocks.push(<List key={index} start={start}>{items.map((item, i) => <li key={i}>{inlineText(item)}</li>)}</List>);
      continue;
    }
    blocks.push(<p key={index}>{inlineText(line.replace(/^>\s?/, ''))}</p>);
    index++;
  }
  return blocks;
}

function FormattedAnswer({ text }) {
  return <div className="ta-cards">{answerSections(text).map((section, index) =>
    <section className="ta-card" key={index}>
      {section.title && <h4>{section.title}</h4>}
      <RichLines lines={section.lines} />
    </section>
  )}</div>;
}

const extraStyles = `
.ta-options{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
.ta-options select{width:100%;padding:11px;border:1px solid #cce3f0;border-radius:10px;background:#f8fcff;color:#173a57;font:inherit;font-size:12px}
.ta-starters{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0}
.ta-starters button{padding:16px 12px;border:1px solid #cee6f5;border-radius:14px;background:linear-gradient(135deg,#eef9ff,#fff);color:#174c72;text-align:left;font-size:12px;line-height:1.6}
.ta-starters button:hover{border-color:#2596d6;background:#e6f5ff}
.ta-cards{display:grid;gap:14px;padding:16px;line-height:1.8;font-size:14px}
.ta-card{background:#f5fbff;border:1px solid #d8edf8;border-left:3px solid #62b6e2;padding:18px;border-radius:12px;overflow-wrap:anywhere;min-width:0}
.ta-card:nth-child(even){background:#fffdf7;border-color:#eee4c8;border-left-color:#d9ab58}
.ta-card h4{margin:0 0 10px;font-size:16px;color:#174c72}
.ta-card p{margin:8px 0}.ta-card ul,.ta-card ol{padding-left:24px;margin:8px 0}.ta-card li{padding-left:4px;margin:7px 0}
.ta-table{overflow-x:auto}.ta-table table{border-collapse:collapse;width:100%;min-width:400px}.ta-table th,.ta-table td{border:1px solid #cce3f0;padding:10px;text-align:left;vertical-align:top}.ta-table th{background:#e4f3fc}
.ta-tools{display:flex;flex-wrap:wrap;gap:8px;padding:14px 16px;border-top:1px solid #e5f1f8}
.ta-tools button,.ta-tabs button{padding:9px 12px;border:1px solid #c7e4f5;border-radius:10px;color:#246b9b;background:#f7fcff;font-size:12px}
.ta-tools button[aria-pressed=true],.ta-tabs button[aria-pressed=true]{background:#17659a;color:white}
.ta-history{margin-top:24px;border:1px solid #d4eaf7;border-radius:16px;padding:16px;background:white}
.ta-tabs{display:flex;flex-wrap:wrap;gap:8px}.ta-history p,.ta-status{font-size:12px;line-height:1.6;color:#577b94}
.ta-history-item{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #e5f1f8;padding:14px 0;background:transparent;color:#173a57}
.ta-history-item span{display:block;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ta-history-item small{display:block;font-size:10px;color:#577b94;margin-top:5px}
.ta-loading{margin-top:18px;padding:18px;background:#eef8ff;border-radius:12px;color:#246b9b}
button:disabled{cursor:wait;opacity:.55}
@media(max-width:600px){.ta-options,.ta-starters{grid-template-columns:1fr}.ta-card{padding:14px}.ta-cards{padding:10px}}
@media print{.ta-options,.ta-starters,.ta-history,.ta-tools,.ta-status,.ta-loading{display:none!important}.ta-card{break-inside:avoid;background:white}.ta-cards{padding:0}.answerHead button{display:none!important}}
`;

export default function Home() {
  const [selected, setSelected] = useState('advisor');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState(-1);
  const [mobile, setMobile] = useState(false);


  const [grade, setGrade] = useState('');
  const [direction, setDirection] = useState('');
  const [duration, setDuration] = useState('');
  const [history, setHistory] = useState([]);
  const [historyTab, setHistoryTab] = useState('recent');
  const [activeId, setActiveId] = useState(null);
  const [notice, setNotice] = useState('');
  const requestVersion = useRef(0);
  const controller = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(saved)) setHistory(saved.filter(item =>
        item && typeof item.id === 'string' && typeof item.output === 'string' &&
        typeof item.input === 'string' && modules.some(module => module.id === item.module)
      ));
    } catch {
      setNotice('Сақталған жауаптарды оқу мүмкін болмады.');
    }
    return () => controller.current?.abort();
  }, []);

  function saveHistory(items) {
    setHistory(items);
    try { localStorage.setItem(storageKey, JSON.stringify(items)); }
    catch { setNotice('Браузер жадына сақтау мүмкін болмады. Жауапты Word арқылы жүктеп алыңыз.'); }
  }

  function cancelRequest() {
    requestVersion.current++;
    controller.current?.abort();
    setBusy(false);
  }

  function openSaved(item) {
    cancelRequest();
    setSelected(item.module);
    setInput(item.input);
    setOutput(item.output);
    setGrade(item.grade || '');
    setDirection(item.direction || '');
    setDuration(item.duration || '');
    setActiveId(item.id);
    setError('');
    setStage(-1);
  }

  function toggleFavorite() {
    saveHistory(history.map(item => item.id === activeId
      ? { ...item, favorite: !item.favorite } : item));
  }

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(plainText(output));
      setNotice('Жауап көшірілді.');
    } catch { setNotice('Көшіру орындалмады. Жауап мәтінін белгілеп көшіріңіз.'); }
  }

  function setExample(text) {
    cancelRequest();
    setInput(text);
    setOutput('');
    setActiveId(null);
    setError('');
  }

  const current = modules.find(module => module.id === selected);

  function choose(id) {
    cancelRequest();
    setActiveId(null);
    setSelected(id);
    setInput('');
    setOutput('');
    setError('');
    setMobile(false);
  }

  async function generate(refinement = '') {
    if (!input.trim()) {
      setError('Алдымен тапсырманы енгізіңіз.');
      return;
    }
    cancelRequest();
    const version = requestVersion.current;
    const abort = new AbortController();
    controller.current = abort;
    const context = [
      grade && 'Сынып: ' + grade,
      direction && 'Тәрбие бағыты: ' + direction,
      duration && 'Ұзақтығы: ' + duration + ' минут'
    ].filter(Boolean).join('\n');
    const format = 'Жауапты мына бөлімдермен бер: ' + sectionTemplates[selected] +
      '. Әр бөлім тақырыбын ## арқылы белгіле. Қысқа абзацтар және нақты тізімдер қолдан. ' +
      (selected === 'planner' ? 'Сабақ кезеңдерін уақыт, әрекет, әдіс бағандары бар Markdown кестесімен бер. ' : '') +
      'Жоқ деректерді ойдан қоспа. ';
    const original = context + '\nТапсырма: ' + input;
    const prompt = refinement
      ? format + original + '\nАлдыңғы жауап:\n' + output + '\nӨңдеу талабы: ' + refinement
      : format + original;
    if (prompt.length > 7000) {
      setError('Мәтін көлемі үлкен. Тапсырманы қысқартыңыз немесе жауаптың қажетті бөлігін жаңа тапсырмаға көшіріңіз.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    const timeout = setTimeout(() => abort.abort(), 90000);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: selected, input: prompt }),
        signal: abort.signal
      });
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw Error('Сервер дұрыс жауап қайтармады. Біраздан кейін қайталап көріңіз.');
      }
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'Сұрау орындалмады');
      if (typeof data.output !== 'string' || !data.output.trim()) {
        throw Error('Жауап бос қайтты. Қайта көріңіз.');
      }
      if (version !== requestVersion.current) return;
      const item = {
        id: crypto.randomUUID(), module: selected, input, output: data.output,
        grade, direction, duration, createdAt: new Date().toISOString(), favorite: false
      };
      setOutput(data.output);
      setActiveId(item.id);
      const existing = history.filter(entry => entry.favorite);
      const recent = history.filter(entry => !entry.favorite).slice(0, 19);
      saveHistory([item, ...existing, ...recent]);
    } catch (error) {
      if (version === requestVersion.current) {
        setError(error.name === 'AbortError'
          ? 'Күту уақыты аяқталды. Қайта байқап көріңіз.' : error.message);
      }
    } finally {
      clearTimeout(timeout);
      if (version === requestVersion.current) setBusy(false);
    }
  }

  function startDemo() {
    setStage(0);
    choose(demo[0]);
    setInput(modules.find(module => module.id === demo[0]).example);
  }

  function nextDemo() {
    const next = (stage + 1) % 3;
    setStage(next);
    choose(demo[next]);
    setInput(modules.find(module => module.id === demo[next]).example);
  }

  const downloadWord = () => saveBlob(
    'tarbie-ai-jauap.doc',
    '\ufeff<html><head><meta charset="utf-8"></head>' +
    '<body style="font-family:Times New Roman;font-size:12pt"><h2>' +
    esc(current.title) +
    '</h2><div style="white-space:pre-wrap">' +
    esc(plainText(output)) +
    '</div></body></html>',
    'application/msword'
  );

  const downloadCsv = () => saveBlob(
    'tarbie-ai-esep.csv',
    '\ufeff"Бөлім","Мәтін"\r\n"' +
    current.title.replaceAll('"', '""') +
    '","' +
    plainText(output).replaceAll('"', '""').replaceAll('\n', ' ') +
    '"',
    'text/csv;charset=utf-8'
  );

  return (
    <main>
      <style>{extraStyles}</style>
      <div className="ornament ornamentL">❧</div>
      <div className="ornament ornamentR">❧</div>

      <header className="header">
        <div className="brand">
          <div className="brandIcon">
            <Sparkles size={25} />
          </div>
          <div>
            <b>ТӘРБИЕ <span>AI</span></b>
            <small>ЦИФРЛЫҚ ТӘРБИЕ МЕНЕДЖЕРІ</small>
          </div>
        </div>

        <nav className={mobile ? 'nav open' : 'nav'}>
          <button onClick={() => {
            setStage(-1);
            choose('advisor');
          }}>
            Басты бет
          </button>
          <button onClick={startDemo}>Байқау режимі</button>
          <button onClick={() =>
            document.getElementById('about')?.scrollIntoView({
              behavior: 'smooth'
            })
          }>
            Жоба туралы
          </button>
        </nav>

        <button
          className="menu"
          onClick={() => setMobile(!mobile)}
          aria-label="Мәзір"
        >
          <Menu />
        </button>
      </header>

      <section className="hero">
        <div className="eyebrow">
          <Sparkles size={15} /> ТӘРБИЕДЕГІ ЖАҢА МҮМКІНДІК
        </div>
        <h1>ТӘРБИЕ <em>AI</em></h1>
        <h2>ЦИФРЛЫҚ ТӘРБИЕ МЕНЕДЖЕРІ</h2>
        <p>Технология — көмекші, тәрбие — жүректен!</p>

        <div className="heroBtns">
          <button
            className="primary"
            onClick={() =>
              document.getElementById('workspace')?.scrollIntoView({
                behavior: 'smooth'
              })
            }
          >
            AI мүмкіндіктерін ашу <ArrowRight size={17} />
          </button>
          <button className="outline" onClick={startDemo}>
            <Play size={16} /> Байқау режимі
          </button>
        </div>

        <div className="orb">
          <div className="orbInner">
            <BrainCircuit size={60} />
          </div>
        </div>

        <div className="author">
          Дайындаған: <strong>Таджиева Фарида Рыскелдиевна</strong>
          <br />
          Қырғызсай жалпы орта білім беретін мектебі
        </div>
      </section>

      <section className="workspace" id="workspace">
        <div className="sectionHead">
          <span>ИНТЕРАКТИВТІ ПЛАТФОРМА</span>
          <h2>Сіздің цифрлық көмекшіңіз</h2>
          <p>Модульді таңдап, тапсырмаңызды енгізіңіз</p>
        </div>

        {stage >= 0 && (
          <div className="demo">
            <span>
              <Play size={16} /> БАЙҚАУ РЕЖИМІ · {stage + 1}/3 ·
              Демонстрациялық тапсырма
            </span>
            <div>
              <button onClick={nextDemo}>
                Келесі тапсырма <ArrowRight size={15} />
              </button>
              <button onClick={() => {
                setStage(-1);
                choose('advisor');
              }}>
                Аяқтау
              </button>
            </div>
          </div>
        )}

        <div className="workGrid">
          <aside className="modules">
            {modules.map(module => {
              const Icon = module.icon;

              return (
                <button
                  key={module.id}
                  className={'module ' + (selected === module.id ? 'active' : '')}
                  onClick={() => {
                    setStage(-1);
                    choose(module.id);
                  }}
                >
                  <div className="moduleIcon">
                    <Icon size={22} />
                  </div>
                  <span>
                    <b>{module.title}</b>
                    <small>{module.short}</small>
                  </span>
                  <ArrowRight size={15} />
                </button>
              );
            })}
            <div className="ta-history">
              <div className="ta-tabs">
                <button aria-pressed={historyTab === 'recent'} onClick={() => setHistoryTab('recent')}>Соңғы жауаптар</button>
                <button aria-pressed={historyTab === 'favorites'} onClick={() => setHistoryTab('favorites')}>Таңдаулылар</button>
              </div>
              <p>Осы браузерде сақталады. Соңғы 20 жауап пен таңдаулылар қолжетімді.</p>
              {history.filter(item => historyTab !== 'favorites' || item.favorite).map(item =>
                <button className="ta-history-item" key={item.id} onClick={() => openSaved(item)}>
                  <span>{item.favorite ? '★ ' : ''}{item.input}</span>
                  <small>{modules.find(module => module.id === item.module)?.title}</small>
                </button>
              )}
              {!history.some(item => historyTab !== 'favorites' || item.favorite) &&
                <p>{historyTab === 'favorites' ? 'Ұнаған жауапты жұлдызша арқылы сақтаңыз.' : 'Алғашқы жауабыңыз осы жерде сақталады.'}</p>}
            </div>
          </aside>

          <div className="panel">
            <div className="panelTop">
              <div className="panelIcon">
                <current.icon size={25} />
              </div>
              <div>
                <h3>{current.title}</h3>
                <p>{current.short}</p>
              </div>
            </div>

            <div className="ta-options">
              <label>Сынып<select value={grade} disabled={busy} onChange={event => setGrade(event.target.value)}>
                <option value="">Таңдалмаған</option>
                {Array.from({ length: 11 }, (_, i) => <option key={i} value={String(i + 1)}>{i + 1}-сынып</option>)}
              </select></label>
              <label>Тәрбие бағыты<select value={direction} disabled={busy} onChange={event => setDirection(event.target.value)}>
                <option value="">Таңдалмаған</option>
                {['Адалдық', 'Достық пен сыйластық', 'Жауапкершілік', 'Еңбекқорлық', 'Экология', 'Қауіпсіздік'].map(value => <option key={value}>{value}</option>)}
              </select></label>
              <label>Уақыт<select value={duration} disabled={busy} onChange={event => setDuration(event.target.value)}>
                <option value="">Таңдалмаған</option>
                {[15, 20, 30, 40, 45, 60].map(value => <option key={value} value={value}>{value} минут</option>)}
              </select></label>
            </div>
            {!output && <div className="ta-starters">
              {starterTopics[selected].map(topic => <button key={topic} disabled={busy} onClick={() => setExample(topic)}>{topic} →</button>)}
            </div>}
            <label htmlFor="task">Тапсырмаңыз</label>
            <textarea
              id="task"
              disabled={busy}
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder={current.placeholder}
              maxLength={7000}
            />

            <div className="formActions">
              <button
                className="subtle"
                onClick={() => {
                  setExample(current.example);
                }}
              >
                Үлгіні енгізу
              </button>
              <button
                className="primary"
                onClick={() => generate()}
                disabled={busy}
              >
                {busy ? 'Жауап дайындалуда...' : 'AI жауабын алу'}
                {' '}<Sparkles size={17} />
              </button>
            </div>

            {busy && <div className="ta-loading" role="status">Жауап дайындалуда…</div>}
            {notice && <p className="ta-status" role="status">{notice}</p>}
            {error && (
              <div className="error" role="alert">{error}</div>
            )}

            {output && (
              <div className="answer">
                <div className="answerHead">
                  <b><CheckCircle2 size={18} /> AI жауабы</b>
                  <div>
                    <button
                      onClick={copyAnswer}
                      title="Көшіру"
                    >
                      <Copy size={17} />
                    </button>
                    <button
                      onClick={() => {
                        cancelRequest();
                        setActiveId(null);
                        setOutput('');
                        setError('');
                      }}
                      title="Тазалау"
                    >
                      <RotateCcw size={17} />
                    </button>
                  </div>
                </div>

                <FormattedAnswer text={output} />
                <div className="ta-tools">
                  <button disabled={busy || !activeId} aria-pressed={Boolean(history.find(item => item.id === activeId)?.favorite)} onClick={toggleFavorite}>
                    {history.find(item => item.id === activeId)?.favorite ? '★ Таңдаулыда' : '☆ Таңдаулыға сақтау'}
                  </button>
                  {['Қысқарт', 'Толықтыр', 'Нақты мысал қос', 'Ресми стильге ауыстыр'].map(action =>
                    <button key={action} disabled={busy} onClick={() => generate(action)}>{action}</button>
                  )}
                </div>

                <div className="exports">
                  <button onClick={downloadWord}>
                    <Download size={15} /> Word
                  </button>
                  <button onClick={() => window.print()}>
                    <Download size={15} /> PDF / Басып шығару
                  </button>
                  <button onClick={downloadCsv}>
                    <Download size={15} /> Excel (CSV)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="about" className="about">
        <ShieldCheck size={24} />
        <div>
          <h3>Жасанды интеллект — педагогтің көмекшісі</h3>
          <p>
            Ұсыныстарды педагог кәсіби тұрғыдан тексереді.
            Оқушылардың аты-жөні мен құпия мәліметтерін енгізбеңіз.
            Талдау нақты берілген деректерге сүйенеді.
          </p>
        </div>
      </section>

      <footer>
        © 2026 ТӘРБИЕ AI · Таджиева Фарида Рыскелдиевна · Қырғызсай мектебі
      </footer>
    </main>
  );
}
