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
import { designCopy } from './design-copy';
import { AnalysisView } from './analysis-view';
import { HomeView } from './home-view';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
} from './ui';
import {
  Home,
  Files,
  Bell,
  UserRound,
  ArrowRight,
  ChevronRight,
  Globe2,
  ShieldCheck,
  FileText,
  Upload,
  Check,
  ListChecks,
  LockKeyhole,
  X,
  CircleHelp,
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
    sample?: Sample;
  } | null>(null);
  const [error, setError] = useState(false);
  const [validating, setValidating] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [query, setQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Reminder | null>(null);
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
  const ui = designCopy[lang];
  const checkedCount = checks.filter(Boolean).length;
  const isSampleProfile = !profile.name && !profile.city;
  const currentRun =
    contracts.find((contract) => contract.id === id) ??
    drafts.find((contract) => contract.id === id);
  const sample = currentRun?.sample ?? (id === 'sinchon' ? 'sinchon' : 'mapo');
  const sampleName = (key: Sample) =>
    key === 'mapo' ? t.contractName : copy.sinchon;
  const fullDate = (date: string) =>
    dateLabel(date, lang, { dateStyle: 'medium' });

  useEffect(() => {
    const syncRoute = () => {
      setDragging(false);
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
    if ((modal || pendingDelete) && !dialog.current?.open)
      dialog.current?.showModal();
  }, [modal, pendingDelete]);
  function viewSample() {
    if (!file) return;
    const run = {
      id: newId(),
      name: file.sample ? '' : file.name,
      date: today(),
      sample: file.sample ?? ('mapo' as const),
    };
    setDrafts((previous) => [run, ...previous]);
    go('result', run.id);
  }

  function go(next: Page, resultId = 'mapo') {
    location.hash =
      next === 'result' || next === 'checklist' ? next + '/' + resultId : next;
  }
  function setLang(next: Lang) {
    update((previous) => ({ ...previous, lang: next }));
  }
  function chooseSample(sample: Sample) {
    selection.current++;
    setValidating(false);
    setError(false);
    setFile({ name: '', size: 0, sample });
  }
  async function chooseFile(chosen?: File) {
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
    { id: 'checklist', icon: ListChecks, label: t.checklist },
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
  const visibleContracts = contracts.filter((contract) =>
    (contract.name || sampleName(contract.sample))
      .toLocaleLowerCase(lang)
      .includes(query.trim().toLocaleLowerCase(lang)),
  );
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
    <div className={'app-shell ' + (page === 'home' ? 'landing' : 'workspace')}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        {ui.skip}
      </a>
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
        <nav className="site-nav" aria-label={copy.navigation}>
          {nav.map(({ id: navId, icon: Icon, label }) => {
            const active =
              page === navId ||
              (navId === 'contracts' &&
                (page === 'result' || page === 'upload'));
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
      <main id="main-content" tabIndex={-1}>
        {storageError && (
          <p className="error" role="alert">
            {copy.storageError}
          </p>
        )}
        {page === 'home' ? (
          <HomeView
            lang={lang}
            go={go}
            recent={
              contracts.length
                ? contracts.slice(0, 2).map(historyCard)
                : sampleIds.map(contractCard)
            }
            hasHistory={contracts.length > 0}
            checked={checkedCount}
            total={checks.length}
          />
        ) : (
          <>
            <PageHeader
              title={title}
              back={t.back}
              onBack={() =>
                go(
                  page === 'result' || page === 'upload' ? 'contracts' : 'home',
                )
              }
              description={
                page === 'reminders'
                  ? ui.reminderIntro
                  : page === 'profile'
                    ? ui.profileIntro
                    : undefined
              }
            >
              {page === 'result' && <Badge tone="amber">{t.demo}</Badge>}
            </PageHeader>
            {page === 'upload' && (
              <div className="upload-layout">
                <ol className="flow-steps">
                  {ui.steps.map((step, index) => (
                    <li
                      key={step}
                      aria-current={index === 0 ? 'step' : undefined}
                    >
                      <span>{index + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <div className="notice-box upload-notice">
                  <CircleHelp size={20} aria-hidden="true" />
                  <div>
                    <strong>{t.demo}</strong>
                    <p>{copy.uploadNotice}</p>
                  </div>
                </div>
                <Card className="upload-card">
                  <label
                    className={'upload-zone' + (dragging ? ' dragging' : '')}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'copy';
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragging(false);
                      void chooseFile(event.dataTransfer.files[0]);
                    }}
                  >
                    <span className="upload-circle">
                      <Upload size={25} aria-hidden="true" />
                    </span>
                    <strong>{ui.drop}</strong>
                    <span>{t.selectSub}</span>
                    <span className="control-outline">{t.choose}</span>
                    <input
                      aria-label={t.choose}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(event) => {
                        const chosen = event.currentTarget.files?.[0];
                        event.currentTarget.value = '';
                        void chooseFile(chosen);
                      }}
                    />
                  </label>
                  {validating && (
                    <p className="privacy-line" role="status">
                      {copy.validating}
                    </p>
                  )}
                  {error && (
                    <p role="alert" className="error">
                      {t.fileError}
                    </p>
                  )}
                  {file && (
                    <div className="selected-file">
                      <FileText aria-hidden="true" />
                      <div>
                        <strong>
                          {file.sample ? sampleName(file.sample) : file.name}
                        </strong>
                        {!file.sample && (
                          <small role="status">
                            {(file.size / 1024).toFixed(1)} KB · {ui.fileReady}
                          </small>
                        )}
                      </div>
                      <button
                        className="icon-button"
                        aria-label={copy.remove}
                        onClick={() => setFile(null)}
                      >
                        <X size={18} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </Card>
                <Card className="sample-picker">
                  <h2>{ui.chooseExample}</h2>
                  {sampleIds.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className="contract-row"
                      onClick={() => chooseSample(key)}
                      aria-pressed={file?.sample === key}
                    >
                      <span className="file-icon">
                        <FileText size={19} aria-hidden="true" />
                      </span>
                      <span className="contract-info">
                        <strong>{sampleName(key)}</strong>
                        <small>{t.sampleLabel}</small>
                      </span>
                      {file?.sample === key ? (
                        <Check size={18} aria-hidden="true" />
                      ) : (
                        <ChevronRight size={18} aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </Card>
                <div className="upload-actions">
                  <p className="privacy-line">
                    <LockKeyhole size={16} aria-hidden="true" />
                    {copy.local}
                  </p>
                  <Button disabled={!file || validating} onClick={viewSample}>
                    {ui.viewSample}
                    <ArrowRight size={18} aria-hidden="true" />
                  </Button>
                </div>
              </div>
            )}
            {page === 'result' && (
              <AnalysisView
                key={id}
                lang={lang}
                sample={sample}
                name={sampleName(sample)}
                run={currentRun}
                missing={unknownRun}
                saved={contracts.some((item) => item.id === id)}
                storageError={storageError}
                onSave={saveRun}
                onChecklist={() => go('checklist', id)}
              />
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
                <p className="notice-box">{ui.checklistTip}</p>
                <div className="check-items">
                  {[[0, 1, 2], [3], [4]].map((items, stage) => (
                    <Card className="check-group" key={stage}>
                      <h2>{ui.checklistStages[stage]}</h2>
                      {items.map((i) => (
                        <label
                          className={
                            'check-item ' + (checks[i] ? 'checked' : '')
                          }
                          key={i}
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
                          <span>{t.checks[i]}</span>
                        </label>
                      ))}
                    </Card>
                  ))}
                </div>
                {checks.every(Boolean) && (
                  <div className="notice-box">
                    <ShieldCheck />
                    {t.checked}
                  </div>
                )}
                <button
                  className="control-outline full"
                  onClick={() => go('result', id)}
                >
                  {t.result}
                  <ArrowRight size={17} />
                </button>
                <Button
                  variant="text-link"
                  className="full"
                  onClick={() => go('reminders')}
                >
                  <Bell size={16} aria-hidden="true" />
                  {t.reminders}
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
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
                {contracts.length > 0 && (
                  <label className="search-label">
                    {ui.search}
                    <Input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </label>
                )}
                {visibleContracts.length ? (
                  <div className="contract-list saved-list">
                    {visibleContracts.map(historyCard)}
                  </div>
                ) : (
                  <EmptyState>
                    {contracts.length ? ui.noMatches : copy.emptyHistory}
                  </EmptyState>
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
                        className="control-outline"
                        onClick={() => setReminder(null)}
                      >
                        {copy.cancel}
                      </button>
                    </div>
                  </form>
                )}
                {reminders.length === 0 && (
                  <EmptyState>{copy.emptyReminders}</EmptyState>
                )}
                <div className="timeline">
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
                            className={
                              'badge ' + (item.done ? 'green' : 'blue')
                            }
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
                                  reminders: previous.reminders.map(
                                    (existing) =>
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
                              onClick={() => setPendingDelete(item)}
                            >
                              {copy.delete}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                </div>
                <button
                  className="control-outline full"
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
                    <Input
                      name="name"
                      autoComplete="name"
                      maxLength={70}
                      defaultValue={profile.name}
                    />
                  </label>
                  <label>
                    {copy.city}
                    <Input
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
                <p className="notice-box">
                  <LockKeyhole size={18} aria-hidden="true" />
                  {ui.localData}
                </p>
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
      <Modal
        dialogRef={dialog}
        title={
          pendingDelete
            ? ui.deleteTitle
            : modal === 'about'
              ? t.about
              : t.privacy
        }
        close={copy.close}
        onClose={() => {
          setModal(null);
          setPendingDelete(null);
        }}
      >
        {pendingDelete ? (
          <>
            <p>{ui.deleteBody}</p>
            <div className="form-actions">
              <Button
                variant="outline"
                autoFocus
                onClick={() => dialog.current?.close()}
              >
                {copy.cancel}
              </Button>
              <Button
                className="destructive"
                onClick={() => {
                  if (reminder?.id === pendingDelete.id) setReminder(null);
                  update((previous) => ({
                    ...previous,
                    reminders: previous.reminders.filter(
                      (item) => item.id !== pendingDelete.id,
                    ),
                  }));
                  dialog.current?.close();
                }}
              >
                {copy.delete}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p>{modal === 'about' ? ui.intro : ui.localData}</p>
            <div className="notice-box">{t.notice}</div>
            <Button className="full" onClick={() => dialog.current?.close()}>
              {copy.close}
              <Check size={17} aria-hidden="true" />
            </Button>
          </>
        )}
      </Modal>
    </div>
  );
}
