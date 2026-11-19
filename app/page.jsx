'use client';

import { useState } from 'react';
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

export default function Home() {
  const [selected, setSelected] = useState('advisor');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState(-1);
  const [mobile, setMobile] = useState(false);

  const current = modules.find(module => module.id === selected);

  function choose(id) {
    setSelected(id);
    setInput('');
    setOutput('');
    setError('');
    setMobile(false);
  }

  async function generate() {
    if (!input.trim()) {
      setError('Алдымен тапсырманы енгізіңіз.');
      return;
    }

    setBusy(true);
    setError('');
    setOutput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: selected, input })
      });

      const data = await response.json();

      if (!response.ok) {
        throw Error(data.error || 'Сұрау орындалмады');
      }

      setOutput(data.output);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
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
    esc(output) +
    '</div></body></html>',
    'application/msword'
  );

  const downloadCsv = () => saveBlob(
    'tarbie-ai-esep.csv',
    '\ufeff"Бөлім","Мәтін"\r\n"' +
    current.title.replaceAll('"', '""') +
    '","' +
    output.replaceAll('"', '""').replaceAll('\n', ' ') +
    '"',
    'text/csv;charset=utf-8'
  );

  return (
    <main>
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

            <label htmlFor="task">Тапсырмаңыз</label>
            <textarea
              id="task"
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder={current.placeholder}
              maxLength={7000}
            />

            <div className="formActions">
              <button
                className="subtle"
                onClick={() => {
                  setInput(current.example);
                  setOutput('');
                  setError('');
                }}
              >
                Үлгіні енгізу
              </button>
              <button
                className="primary"
                onClick={generate}
                disabled={busy}
              >
                {busy ? 'Жауап дайындалуда...' : 'AI жауабын алу'}
                {' '}<Sparkles size={17} />
              </button>
            </div>

            {error && (
              <div className="error" role="alert">{error}</div>
            )}

            {output && (
              <div className="answer">
                <div className="answerHead">
                  <b><CheckCircle2 size={18} /> AI жауабы</b>
                  <div>
                    <button
                      onClick={() => navigator.clipboard?.writeText(output)}
                      title="Көшіру"
                    >
                      <Copy size={17} />
                    </button>
                    <button
                      onClick={() => {
                        setOutput('');
                        setError('');
                      }}
                      title="Тазалау"
                    >
                      <RotateCcw size={17} />
                    </button>
                  </div>
                </div>

                <div className="answerText">{output}</div>

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
