'use client';
import { useState, useEffect, useRef } from 'react';
import {
  sampleIds,
  samples,
  readRoute,
  dateLabel,
  validFile,
  validDate,
} from './demo';
import type { Lang, Page, Sample, Contract, Reminder } from './demo';
import { demoCopy, words } from './demo-copy';
import { useDemoStorage } from './use-demo-storage';
import {
  Home,
  Files,
  Bell,
  UserRound,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Globe2,
  ShieldCheck,
  FileText,
  Upload,
  Check,
  CheckCheck,
  ListChecks,
  Sparkles,
  LockKeyhole,
  X,
  Building2,
  CalendarDays,
  CircleHelp,
  TriangleAlert,
} from 'lucide-react';
const today = () =>
  new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
const newId = () =>
  Array.from(crypto.getRandomValues(new Uint32Array(4)), (part) =>
    part.toString(36),
  ).join('-');
export default function App() {
  const { data, update, storageError } = useDemoStorage();
  const [route, setRoute] = useState<{ page: Page; id: string }>({
    page: 'home',
    id: 'mapo',
  });
  const [file, setFile] = useState<{
    name: string;
    size: number;
    sample?: boolean;
  } | null>(null);
  const [error, setError] = useState(false);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<Contract[]>([]);
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [modal, setModal] = useState<'about' | 'privacy' | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const selection = useRef(0);
  const { lang, checks, contracts, reminders, profile, notify } = data;
  const { page, id } = route;
  const t = words[lang];
  const copy = demoCopy[lang];
  const checkedCount = checks.filter(Boolean).length;
  const isSampleProfile = !profile.name && !profile.city;
  const currentRun =
    contracts.find((contract) => contract.id === id) ??
    drafts.find((contract) => contract.id === id);
  const sample = currentRun?.sample ?? (id === 'sinchon' ? 'sinchon' : 'mapo');
  const example = samples[sample];
  const details = sample === 'sinchon' ? copy.sinchonDetails : copy.mapo;
  const sampleName = (key: Sample) =>
    key === 'mapo' ? t.contractName : copy.sinchon;
  const fullDate = (date: string) =>
    dateLabel(date, lang, { dateStyle: 'medium' });

  useEffect(() => {
    const syncRoute = () => {
      setLoading(false);
      setReminder(null);
      setProfileSaved(false);
      setRoute(readRoute());
      window.scrollTo(0, 0);
    };
    syncRoute();
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    if (modal) dialog.current?.showModal();
  }, [modal]);
  useEffect(() => {
    if (!loading || page !== 'upload' || !file) return;
    const timer = window.setTimeout(() => {
      if (readRoute().page !== 'upload') return;
      const run = {
        id: newId(),
        name: file.sample ? '' : file.name,
        date: today(),
        sample: 'mapo' as const,
      };
      setDrafts((previous) => [run, ...previous]);
      setLoading(false);
      location.hash = 'result/' + run.id;
    }, 650);
    return () => window.clearTimeout(timer);
  }, [file, loading, page]);

  function go(next: Page, resultId = 'mapo') {
    location.hash =
      next === 'result' || next === 'checklist' ? next + '/' + resultId : next;
  }
  function setLang(next: Lang) {
    update((previous) => ({ ...previous, lang: next }));
  }
  function chooseSample() {
    selection.current++;
    setValidating(false);
    setError(false);
    setFile({ name: 'Mapo_rental_sample.pdf', size: 245760, sample: true });
  }
  async function chooseFile(input: HTMLInputElement) {
    const chosen = input.files?.[0];
    input.value = '';
    if (!chosen) return;
    const request = ++selection.current;
    setError(false);
    setFile(null);
    setValidating(true);
    const valid = await validFile(chosen).catch(() => false);
    if (request !== selection.current) return;
    setValidating(false);
    setError(!valid);
    if (valid) setFile({ name: chosen.name, size: chosen.size });
  }
  function saveRun() {
    if (currentRun && contracts.some((item) => item.id === currentRun.id))
      return;
    const run = currentRun ?? { id: newId(), name: '', date: today(), sample };
    update((previous) =>
      previous.contracts.some((item) => item.id === run.id)
        ? previous
        : { ...previous, contracts: [run, ...previous.contracts] },
    );
    if (!currentRun) {
      setRoute({ page: 'result', id: run.id });
      go('result', run.id);
    }
  }
  function reminderTitle(item: Reminder) {
    return item.title || (item.id === 'rent' ? t.rent : t.expiry);
  }
  const nav = [
    { id: 'home', icon: Home, label: t.home },
    { id: 'contracts', icon: Files, label: t.contracts },
    { id: 'reminders', icon: Bell, label: t.reminders },
    { id: 'profile', icon: UserRound, label: t.profile },
  ] as const;
  const title =
    page === 'upload'
      ? t.select
      : page === 'result'
        ? t.result
        : page === 'checklist'
          ? t.checklist
          : page === 'contracts'
            ? t.contracts
            : page === 'reminders'
              ? t.reminders
              : t.profile;
  const historyCard = (contract: Contract) => (
    <button
      key={contract.id}
      className="contract-row"
      onClick={() => go('result', contract.id)}
    >
      <span className="file-icon">
        <FileText />
      </span>
      <span className="contract-info">
        <strong>{contract.name || sampleName(contract.sample)}</strong>
        <small>
          {fullDate(contract.date)} · {t.demoData}
        </small>
      </span>
      <ChevronRight size={17} className="muted" />
    </button>
  );
  const unknownRun = !currentRun && id !== 'mapo' && id !== 'sinchon';
  const contractCard = (key: Sample) => (
    <button
      key={key}
      className="contract-row"
      onClick={() => go('result', key)}
    >
      <span className={'file-icon ' + (key === 'sinchon' ? 'mint' : '')}>
        <FileText size={23} />
      </span>
      <span className="contract-info">
        <strong>{sampleName(key)}</strong>
        <small>
          {fullDate(samples[key].date)} · {t.sampleLabel}
        </small>
      </span>
      <span className={'badge ' + (key === 'sinchon' ? 'green' : 'danger')}>
        {copy.levels[key === 'sinchon' ? 2 : 0]}
      </span>
      <ChevronRight size={17} className="muted" />
    </button>
  );
  return (
    <div className="app-shell">
      <header>
        <button
          className="brand"
          onClick={() => go('home')}
          aria-label={`LinkUs · ${t.home}`}
        >
          <span className="brand-mark">
            <span />
            <span />
          </span>
          Link<span className="brand-blue">Us</span>
          <span className="brand-dot" />
        </button>
        <div className="header-right">
          <span className="demo-pill">
            <span />
            {t.demo}
          </span>
          <label className="language">
            <Globe2 size={16} />
            <select
              aria-label={t.language}
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ko">한국어</option>
            </select>
          </label>
          <button
            className="avatar"
            onClick={() => go('profile')}
            aria-label={t.profile}
          >
            {profile.name[0] || 'J'}
          </button>
        </div>
      </header>
      <main>
        {storageError && (
          <p className="error" role="alert">
            {copy.storageError}
          </p>
        )}
        {page === 'home' ? (
          <>
            <div className="eyebrow">
              <span className="tiny-line" />
              {t.greeting}
            </div>
            <section className="hero">
              <div className="hero-copy">
                <span className="hero-tag">
                  <ShieldCheck size={14} /> {copy.tagline}
                </span>
                <h1>
                  {t.hero}
                  <br />
                  <span>{t.hero2}</span>
                </h1>
                <p>{t.intro}</p>
                <button className="primary" onClick={() => go('upload')}>
                  <Upload size={18} />
                  {t.upload}
                  <ArrowUpRight size={19} />
                </button>
                <button
                  className="text-link sample-link"
                  onClick={() => go('result')}
                >
                  {t.sample}
                  <ArrowRight size={16} />
                </button>
                <div className="hero-foot">
                  <span>
                    <LockKeyhole size={13} />
                    {lang === 'zh'
                      ? '无需注册'
                      : lang === 'ko'
                        ? '가입 없이 간편하게'
                        : 'No sign-up needed'}
                  </span>
                  <span className="small-dot" />
                  <span>한국어 · 中文 · English</span>
                </div>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="orbit orbit1" />
                <div className="orbit orbit2" />
                <span className="spark s1">✧</span>
                <span className="spark s2">✦</span>
                <div className="back-paper" />
                <div className="paper">
                  <div className="paper-top">
                    <div className="paper-icon">
                      <Building2 size={25} />
                    </div>
                    <span>
                      {t.sampleLabel}
                      <br />
                      <b>{t.contractName}</b>
                    </span>
                    <span className="paper-dots">•••</span>
                  </div>
                  <div className="paper-rule" />
                  <div className="paper-lines">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="paper-highlight">
                    <span />
                    <i />
                  </div>
                  <div className="paper-lines lower">
                    <i />
                    <i />
                  </div>
                  <div className="paper-bottom">
                    <ShieldCheck size={15} /> LinkUs · {t.demo} <span>✧</span>
                  </div>
                </div>
                <div className="art-label">
                  <span className="art-check">
                    <Check size={17} />
                  </span>
                  <div>
                    <strong>
                      {lang === 'zh'
                        ? '复杂合同，简单理解'
                        : lang === 'ko'
                          ? '어려운 계약도 쉽게'
                          : 'Complex terms. Made clear.'}
                    </strong>
                    <small>
                      한국어 →{' '}
                      {{ en: 'English', zh: '中文', ko: '한국어' }[lang]}
                    </small>
                  </div>
                  <Sparkles size={19} />
                </div>
                <div className="shield-float">
                  <ShieldCheck size={46} strokeWidth={1.8} />
                </div>
                <span className="art-dot dot1" />
                <span className="art-dot dot2" />
              </div>
            </section>
            <section className="how">
              <div className="section-title">
                <h2>{t.guide}</h2>
              </div>
              <div className="steps">
                {t.steps.map((s, i) => {
                  const Icon = [Upload, FileText, ShieldCheck][i];
                  return (
                    <button
                      key={s}
                      className="step"
                      onClick={() =>
                        go(
                          i === 0 ? 'upload' : i === 1 ? 'result' : 'checklist',
                        )
                      }
                    >
                      <span className={'step-icon color' + i}>
                        <Icon size={23} />
                      </span>
                      <div>
                        <h3>{s}</h3>
                        <p>{t.stepSub[i]}</p>
                      </div>
                      <ChevronRight size={17} />
                    </button>
                  );
                })}
              </div>
            </section>
            <div className="home-bottom">
              <section className="recent">
                <div className="section-title">
                  <h2>{contracts.length ? t.recent : copy.samples}</h2>
                  <button className="text-link" onClick={() => go('contracts')}>
                    {t.all}
                    <ArrowRight size={15} />
                  </button>
                </div>
                <div className="contract-list">
                  {contracts.length
                    ? contracts.slice(0, 2).map(historyCard)
                    : sampleIds.map(contractCard)}
                </div>
              </section>
              <button className="check-promo" onClick={() => go('checklist')}>
                <span className="promo-top">
                  <span className="promo-icon">
                    <ListChecks size={22} />
                  </span>
                  <ArrowUpRight size={20} />
                </span>
                <h3>{t.checklist}</h3>
                <p>{t.checkSub}</p>
                <span className="progress-track" aria-hidden="true">
                  <i
                    style={{
                      width: `${(checkedCount / checks.length) * 100}%`,
                    }}
                  />
                </span>
                <span className="progress-caption">
                  {checkedCount} / {checks.length} {t.complete}
                  <ChevronRight size={15} />
                </span>
              </button>
            </div>
            <div className="demo-note">
              <CircleHelp size={15} />
              <p>{t.notice}</p>
              <span>{t.demoData}</span>
            </div>
          </>
        ) : (
          <>
            <div className="page-heading">
              <button
                className="back"
                onClick={() =>
                  go(
                    page === 'result' || page === 'upload'
                      ? 'contracts'
                      : 'home',
                  )
                }
                aria-label={t.back}
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <span className="eyebrow">LINKUS / {t.demoData}</span>
                <h1>{title}</h1>
              </div>
              {page === 'result' && (
                <span className="badge amber">{t.demo}</span>
              )}
            </div>
            {page === 'upload' && (
              <div className="narrow">
                <div className="notice-box">
                  <CircleHelp size={19} />
                  {copy.uploadNotice}
                </div>
                <label className="upload-zone">
                  <span className="upload-circle">
                    <Upload size={32} />
                  </span>
                  <h2>{t.select}</h2>
                  <p>{t.selectSub}</p>
                  <span className="primary">
                    {t.choose}
                    <ArrowUpRight size={17} />
                  </span>
                  <input
                    aria-label={t.choose}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={loading}
                    onChange={(event) => void chooseFile(event.currentTarget)}
                  />
                </label>
                {error && (
                  <p role="alert" className="error">
                    {t.fileError}
                  </p>
                )}
                <button
                  className="outline full"
                  disabled={loading}
                  onClick={chooseSample}
                >
                  <FileText size={18} />
                  {t.useSample}
                </button>
                {file && (
                  <div className="selected-file">
                    <FileText />
                    <div>
                      <strong>
                        {file.sample ? t.contractName : file.name}
                      </strong>
                      {!file.sample && (
                        <small>{(file.size / 1024).toFixed(1)} KB</small>
                      )}
                    </div>
                    <button
                      aria-label={copy.remove}
                      disabled={loading}
                      onClick={() => setFile(null)}
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
                <button
                  disabled={!file || loading || validating}
                  className="primary full"
                  onClick={() => setLoading(true)}
                >
                  <Sparkles size={18} />
                  {t.analyze}
                  <ArrowRight size={18} />
                </button>
                {(loading || validating) && (
                  <p className="privacy-line" role="status">
                    {loading ? t.analyzing : copy.validating}
                  </p>
                )}
                <p className="privacy-line">
                  <LockKeyhole size={14} />
                  {copy.local}
                </p>
              </div>
            )}
            {page === 'result' && (
              <>
                <div className="notice-box">
                  <CircleHelp size={19} />
                  <div>
                    {t.notice}
                    {currentRun?.name && <p>{copy.source}</p>}
                    {unknownRun && <p>{copy.missingRun}</p>}
                  </div>
                </div>
                <div className="results-grid">
                  <div>
                    <section className="risk-overview">
                      <span className="badge amber">
                        <TriangleAlert size={13} />
                        {t.demoData}
                      </span>
                      <h2>{sample === 'mapo' ? t.risk : copy.lowSummary}</h2>
                      <p>{sample === 'mapo' ? t.riskSub : copy.lowDetail}</p>
                      <strong>{sampleName(sample)}</strong>
                      {currentRun?.name && (
                        <small>
                          {copy.selected} · {currentRun.name}
                        </small>
                      )}
                    </section>
                    <section className="overview">
                      <h3>{t.summary}</h3>
                      <div>
                        <span>{t.monthly}</span>
                        <strong>{example.rent}</strong>
                      </div>
                      <div>
                        <span>{t.deposit}</span>
                        <strong>{example.deposit}</strong>
                      </div>
                      <div>
                        <CalendarDays size={16} />
                        <span>{t.term}</span>
                      </div>
                    </section>
                  </div>
                  <div className="risk-cards">
                    {[t.deposit, t.fee, t.penalty, t.special].map(
                      (clause, index) => {
                        const level = example.levels[index];
                        return (
                          <details key={index} open className="risk-card">
                            <summary>
                              <h3>{clause}</h3>
                              <span
                                className={
                                  'badge ' + ['danger', 'amber', 'green'][level]
                                }
                              >
                                {copy.levels[level]}
                              </span>
                              <ChevronRight
                                className="risk-chevron"
                                size={16}
                              />
                            </summary>
                            <dl>
                              {[copy.reason, copy.explanation, copy.action].map(
                                (label, part) => (
                                  <div key={part}>
                                    <dt>{label}</dt>
                                    <dd>{details[index][part]}</dd>
                                  </div>
                                ),
                              )}
                            </dl>
                          </details>
                        );
                      },
                    )}
                    <button
                      className="primary full"
                      onClick={() => go('checklist', id)}
                    >
                      <ListChecks size={18} />
                      {t.checkAction}
                      <ArrowRight size={17} />
                    </button>
                    {contracts.some((contract) => contract.id === id) ? (
                      <p className="save-status" role="status">
                        <CheckCheck size={18} />
                        {storageError ? copy.keptInTab : copy.saved}
                      </p>
                    ) : (
                      <button className="outline full" onClick={saveRun}>
                        <Files size={18} />
                        {copy.save}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
            {page === 'checklist' && (
              <div className="narrow">
                <p className="subtitle">{t.checkSub}</p>
                <div className="check-progress">
                  <span>{t.complete}</span>
                  <strong>
                    {checkedCount} / {checks.length}
                  </strong>
                </div>
                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label={t.checklist}
                  aria-valuenow={checkedCount}
                  aria-valuemin={0}
                  aria-valuemax={checks.length}
                >
                  <i
                    style={{
                      width: `${(checkedCount / checks.length) * 100}%`,
                    }}
                  />
                </div>
                <div className="check-items">
                  {t.checks.map((s, i) => (
                    <label
                      className={'check-item ' + (checks[i] ? 'checked' : '')}
                      key={s}
                    >
                      <input
                        type="checkbox"
                        checked={checks[i]}
                        onChange={() =>
                          update((previous) => ({
                            ...previous,
                            checks: previous.checks.map((value, index) =>
                              index === i ? !value : value,
                            ),
                          }))
                        }
                      />
                      <span className="check-box">
                        {checks[i] && <Check size={16} />}
                      </span>
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
                {checks.every(Boolean) && (
                  <div className="notice-box">
                    <ShieldCheck />
                    {t.checked}
                  </div>
                )}
                <button
                  className="outline full"
                  onClick={() => go('result', id)}
                >
                  {t.result}
                  <ArrowRight size={17} />
                </button>
                <div className="demo-note">
                  <CircleHelp size={16} />
                  <p>{t.notice}</p>
                </div>
              </div>
            )}
            {page === 'contracts' && (
              <>
                <div className="section-title">
                  <h2>{copy.history}</h2>
                  <button
                    className="primary compact"
                    onClick={() => go('upload')}
                  >
                    <Upload size={17} />
                    {t.upload}
                  </button>
                </div>
                {contracts.length ? (
                  <div className="contract-list saved-list">
                    {contracts.map(historyCard)}
                  </div>
                ) : (
                  <p className="empty-state">{copy.emptyHistory}</p>
                )}
                <section className="sample-section">
                  <h2>{copy.samples}</h2>
                  <div className="contract-list">
                    {sampleIds.map(contractCard)}
                  </div>
                </section>
                <div className="demo-note">
                  <CircleHelp size={16} />
                  <p>{copy.local}</p>
                </div>
              </>
            )}
            {page === 'reminders' && (
              <div className="narrow">
                <div className="section-title">
                  <h2>{t.next}</h2>
                  <button
                    className="primary compact"
                    onClick={() =>
                      setReminder({ id: '', title: '', date: '', done: false })
                    }
                  >
                    {copy.add}
                  </button>
                </div>
                {reminder && (
                  <form
                    className="editor"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      const title = String(form.get('title') ?? '').trim();
                      const date = String(form.get('date') ?? '');
                      if (!title || !validDate(date)) return;
                      const item = {
                        ...reminder,
                        id: reminder.id || newId(),
                        title,
                        date,
                      };
                      update((previous) => ({
                        ...previous,
                        reminders: reminder.id
                          ? previous.reminders.map((existing) =>
                              existing.id === item.id
                                ? {
                                    ...existing,
                                    title: item.title,
                                    date: item.date,
                                  }
                                : existing,
                            )
                          : [...previous.reminders, item],
                      }));
                      setReminder(null);
                    }}
                    key={reminder.id}
                  >
                    <h3>{reminder.id ? copy.edit : copy.add}</h3>
                    <label>
                      {copy.title}
                      <input
                        name="title"
                        required
                        pattern={'.*\\S.*'}
                        maxLength={90}
                        autoFocus
                        defaultValue={
                          reminder.id ? reminderTitle(reminder) : ''
                        }
                        onBlur={(event) => {
                          if (!event.currentTarget.value.trim())
                            event.currentTarget.value = '';
                        }}
                      />
                    </label>
                    <label>
                      {copy.date}
                      <input
                        name="date"
                        type="date"
                        required
                        max="9999-12-31"
                        defaultValue={reminder.date}
                      />
                    </label>
                    <div className="form-actions">
                      <button className="primary">{copy.saveChanges}</button>
                      <button
                        type="button"
                        className="outline"
                        onClick={() => setReminder(null)}
                      >
                        {copy.cancel}
                      </button>
                    </div>
                  </form>
                )}
                {reminders.length === 0 && (
                  <p className="empty-state">{copy.emptyReminders}</p>
                )}
                {[...reminders]
                  .sort(
                    (a, b) =>
                      Number(a.done) - Number(b.done) ||
                      a.date.localeCompare(b.date),
                  )
                  .map((item) => (
                    <article className="reminder-card" key={item.id}>
                      <span
                        className={'date-box ' + (item.done ? 'mint' : '')}
                        aria-hidden="true"
                      >
                        {dateLabel(item.date, lang, { month: 'short' })}
                        <strong>{item.date.slice(-2)}</strong>
                      </span>
                      <div className="reminder-content">
                        <h3>{reminderTitle(item)}</h3>
                        <p>
                          <time dateTime={item.date}>
                            {fullDate(item.date)}
                          </time>
                          {item.id === 'rent' && ' · ' + samples.mapo.rent}
                        </p>
                        {item.id === 'expiry' && <p>{copy.renewal}</p>}
                        <span
                          className={'badge ' + (item.done ? 'green' : 'blue')}
                        >
                          {item.done ? t.complete : copy.pending}
                        </span>
                        {(item.id === 'rent' || item.id === 'expiry') && (
                          <span className="badge neutral">{t.demoData}</span>
                        )}
                        <div className="item-actions">
                          <button
                            className="text-link"
                            onClick={() =>
                              update((previous) => ({
                                ...previous,
                                reminders: previous.reminders.map((existing) =>
                                  existing.id === item.id
                                    ? { ...existing, done: !item.done }
                                    : existing,
                                ),
                              }))
                            }
                          >
                            {item.done
                              ? copy.reopen
                              : item.id === 'rent' && !item.title
                                ? t.paid
                                : copy.done}
                          </button>
                          <button
                            className="text-link"
                            onClick={() => setReminder(item)}
                          >
                            {copy.edit}
                          </button>
                          <button
                            className="text-link delete"
                            onClick={() => {
                              if (reminder?.id === item.id) setReminder(null);
                              update((previous) => ({
                                ...previous,
                                reminders: previous.reminders.filter(
                                  (existing) => existing.id !== item.id,
                                ),
                              }));
                            }}
                          >
                            {copy.delete}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                <button
                  className="outline full"
                  onClick={() => go('checklist')}
                >
                  {t.checkAction}
                  <ArrowRight size={17} />
                </button>
                <div className="demo-note">
                  <Bell size={17} />
                  <p>{copy.reminderNote}</p>
                </div>
              </div>
            )}
            {page === 'profile' && (
              <div className="narrow">
                <div className="profile-card">
                  <span className="large-avatar">{profile.name[0] || 'J'}</span>
                  <div>
                    <h2>
                      {profile.name ||
                        (isSampleProfile ? 'Jamie Kim' : t.profile)}
                    </h2>
                    <p>
                      {t.student}
                      {profile.city && ' · ' + profile.city}
                      {isSampleProfile &&
                        ' · ' + { en: 'Seoul', zh: '首尔', ko: '서울' }[lang]}
                    </p>
                    {isSampleProfile && (
                      <span className="badge blue">{t.demoData}</span>
                    )}
                  </div>
                </div>
                <form
                  className="editor"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    update((previous) => ({
                      ...previous,
                      profile: {
                        name: String(form.get('name')).trim(),
                        city: String(form.get('city')).trim(),
                      },
                    }));
                    setProfileSaved(true);
                  }}
                  onChange={() => setProfileSaved(false)}
                >
                  <label>
                    {copy.name}
                    <input
                      name="name"
                      autoComplete="name"
                      maxLength={70}
                      defaultValue={profile.name}
                    />
                  </label>
                  <label>
                    {copy.city}
                    <input
                      name="city"
                      autoComplete="address-level2"
                      maxLength={70}
                      defaultValue={profile.city}
                    />
                  </label>
                  <button className="primary">{copy.saveChanges}</button>
                  {profileSaved && (
                    <span className="save-status" role="status">
                      {storageError ? copy.keptInTab : copy.profileSaved}
                    </span>
                  )}
                </form>
                <h3 className="settings-heading">{t.language}</h3>
                <div className="lang-options">
                  {(
                    [
                      ['ko', '한국어'],
                      ['zh', '中文'],
                      ['en', 'English'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      aria-pressed={lang === value}
                      className={lang === value ? 'active' : ''}
                      key={value}
                      onClick={() => setLang(value)}
                    >
                      {label}
                      {lang === value && <Check size={16} />}
                    </button>
                  ))}
                </div>
                <h3 className="settings-heading">{t.settings}</h3>
                <div className="settings-list">
                  <div>
                    <Bell size={20} />
                    <span>{copy.indicator}</span>
                    <button
                      role="switch"
                      aria-checked={notify}
                      aria-label={copy.indicator}
                      className={'toggle ' + (notify ? 'on' : '')}
                      onClick={() =>
                        update((previous) => ({
                          ...previous,
                          notify: !previous.notify,
                        }))
                      }
                    >
                      <i />
                    </button>
                  </div>
                  <button onClick={() => setModal('privacy')}>
                    <LockKeyhole size={20} />
                    <span>{t.privacy}</span>
                    <ChevronRight size={17} />
                  </button>
                  <button onClick={() => setModal('about')}>
                    <CircleHelp size={20} />
                    <span>{t.about}</span>
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <footer>
        <span className="footer-brand">LinkUs</span>
        <span>{t.support}</span>
      </footer>
      <nav className="bottom-nav" aria-label={copy.navigation}>
        {nav.map(({ id: navId, icon: Icon, label }) => {
          const active =
            page === navId ||
            (navId === 'contracts' && (page === 'result' || page === 'upload'));
          return (
            <button
              key={navId}
              className={active ? 'active' : ''}
              aria-current={active ? 'page' : undefined}
              onClick={() => go(navId)}
            >
              <span className="nav-icon">
                <Icon size={21} />
                {navId === 'reminders' &&
                  notify &&
                  reminders.some((item) => !item.done) && <i />}
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
      <dialog
        className="modal"
        ref={dialog}
        aria-labelledby="modal-title"
        onClose={() => setModal(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="modal-body">
          <button
            className="modal-close"
            onClick={() => dialog.current?.close()}
            aria-label={copy.close}
          >
            <X />
          </button>
          <ShieldCheck className="blue-text" size={35} />
          <h2 id="modal-title">{modal === 'about' ? t.about : t.privacy}</h2>
          <p>{modal === 'about' ? t.intro : copy.local}</p>
          <div className="notice-box">{t.notice}</div>
          <button
            className="primary full"
            onClick={() => dialog.current?.close()}
          >
            {copy.close}
            <Check size={17} />
          </button>
        </div>
      </dialog>
    </div>
  );
}
