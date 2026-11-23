import { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  CheckCheck,
  CircleHelp,
  FileText,
  Files,
  ListChecks,
} from 'lucide-react';
import { demoCopy, words } from './demo-copy';
import { designCopy } from './design-copy';
import { samples } from './demo';
import type { Contract, Lang, Sample } from './demo';
import { Badge, Button, Card, EmptyState } from './ui';

const tones = ['danger', 'amber', 'green'];

export function AnalysisView({
  lang,
  sample,
  name,
  run,
  missing,
  saved,
  storageError,
  onSave,
  onChecklist,
}: {
  lang: Lang;
  sample: Sample;
  name: string;
  run?: Contract;
  missing: boolean;
  saved: boolean;
  storageError: boolean;
  onSave: () => void;
  onChecklist: () => void;
}) {
  const t = words[lang];
  const copy = demoCopy[lang];
  const ui = designCopy[lang];
  const data = samples[sample];
  const details = sample === 'sinchon' ? copy.sinchonDetails : copy.mapo;
  const titles = [t.deposit, t.fee, t.penalty, t.special];
  const [filter, setFilter] = useState('all');
  const [active, setActive] = useState<number | null>(null);
  const [target, setTarget] = useState<{
    side: 'term' | 'risk';
    index: number;
  } | null>(null);
  useEffect(() => {
    if (!target) return;
    const item = document.getElementById(`${target.side}-${target.index}`);
    if (item instanceof HTMLDetailsElement) item.open = true;
    item?.focus({ preventScroll: true });
    item?.scrollIntoView({ block: 'nearest' });
    setTarget(null);
  }, [target]);
  function locate(side: 'term' | 'risk', index: number) {
    if (
      side === 'risk' &&
      filter !== 'all' &&
      Number(filter) !== data.levels[index]
    )
      setFilter('all');
    setActive(index);
    setTarget({ side, index });
  }
  const visible = titles
    .map((_, i) => i)
    .filter((i) => filter === 'all' || Number(filter) === data.levels[i]);
  return (
    <>
      <div className="notice-box analysis-notice">
        <CircleHelp size={20} aria-hidden="true" />
        <div>
          <strong>{t.demo}</strong>
          <p>{t.notice}</p>
          {run?.name && <p>{copy.source}</p>}
          {missing && <p>{copy.missingRun}</p>}
        </div>
      </div>
      <div className="results-grid">
        <Card className="risk-overview">
          <p className="eyebrow">{t.summary}</p>
          <h2>{sample === 'mapo' ? t.risk : copy.lowSummary}</h2>
          <p>{sample === 'mapo' ? t.riskSub : copy.lowDetail}</p>
          {run?.name && (
            <p className="file-reference">
              {copy.selected} · {run.name}
            </p>
          )}
          <dl className="summary-metrics">
            <div>
              <dt>{t.monthly}</dt>
              <dd>{data.rent}</dd>
            </div>
            <div>
              <dt>{t.deposit}</dt>
              <dd>{data.deposit}</dd>
            </div>
            <div>
              <dt>{ui.leaseTerm}</dt>
              <dd>{t.term}</dd>
            </div>
          </dl>
          <div className="analysis-actions">
            <Button onClick={onChecklist}>
              <ListChecks size={18} aria-hidden="true" />
              {t.checkAction}
              <ArrowRight size={17} aria-hidden="true" />
            </Button>
            {saved ? (
              <p className="save-status" role="status">
                <CheckCheck size={18} aria-hidden="true" />
                {storageError ? copy.keptInTab : copy.saved}
              </p>
            ) : (
              <Button variant="outline" onClick={onSave}>
                <Files size={18} aria-hidden="true" />
                {copy.save}
              </Button>
            )}
          </div>
        </Card>
        <Card className="document-panel">
          <div className="panel-heading">
            <span className="feature-icon">
              <FileText size={21} aria-hidden="true" />
            </span>
            <div>
              <h2>{ui.document}</h2>
              <p>{name}</p>
            </div>
          </div>
          <p className="document-note">{ui.digest}</p>
          <div className="terms">
            {titles.map((title, index) => (
              <section
                tabIndex={-1}
                id={'term-' + index}
                className={
                  'term ' +
                  (active === index ? 'linked ' : '') +
                  tones[data.levels[index]]
                }
                key={index}
              >
                <div className="term-head">
                  <span className="term-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3>{title}</h3>
                </div>
                <p>{details[index][0]}</p>
                <Button
                  variant="text-link"
                  aria-label={ui.openRisk + ' · ' + title}
                  onClick={() => locate('risk', index)}
                >
                  {ui.openRisk}
                  <ArrowDownRight size={15} aria-hidden="true" />
                </Button>
              </section>
            ))}
          </div>
        </Card>
        <div className="risk-cards">
          <div className="section-title findings-heading">
            <h2>{ui.findings}</h2>
            <label className="filter-label">
              <span>{ui.filter}</span>
              <select
                className="field"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="all">{ui.allLevels}</option>
                {copy.levels.map((level, i) => (
                  <option key={i} value={i}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {!visible.length && <EmptyState>{ui.noRisk}</EmptyState>}
          {visible.map((index) => (
            <details
              tabIndex={-1}
              id={'risk-' + index}
              open
              key={index}
              className={'risk-card card ' + (active === index ? 'linked' : '')}
            >
              <summary>
                <span className="term-index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{titles[index]}</h3>
                <Badge tone={tones[data.levels[index]]}>
                  {copy.levels[data.levels[index]]}
                </Badge>
              </summary>
              <dl>
                {[copy.reason, copy.explanation, copy.action].map(
                  (label, item) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{details[index][item]}</dd>
                    </div>
                  ),
                )}
              </dl>
              <Button
                variant="text-link"
                aria-label={ui.openTerm + ' · ' + titles[index]}
                onClick={() => locate('term', index)}
              >
                {ui.openTerm}
                <ArrowDownRight size={15} aria-hidden="true" />
              </Button>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}
