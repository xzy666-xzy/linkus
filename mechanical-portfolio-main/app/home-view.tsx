import type { ReactNode } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  CircleHelp,
  FileText,
  Files,
  Globe2,
  ListChecks,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { demoCopy, words } from './demo-copy';
import { designCopy } from './design-copy';
import { samples } from './demo';
import type { Lang, Page } from './demo';
import { Badge, Button, Card } from './ui';

export function HomeView({
  lang,
  go,
  recent,
  hasHistory,
  checked,
  total,
}: {
  lang: Lang;
  go: (page: Page) => void;
  recent: ReactNode;
  hasHistory: boolean;
  checked: number;
  total: number;
}) {
  const t = words[lang];
  const copy = demoCopy[lang];
  const ui = designCopy[lang];
  const steps = [
    { icon: Upload, page: 'upload' },
    { icon: FileText, page: 'result' },
    { icon: ListChecks, page: 'checklist' },
  ] as const;
  const features = [
    { icon: Files, page: 'contracts' },
    { icon: ListChecks, page: 'checklist' },
    { icon: Bell, page: 'reminders' },
  ] as const;
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-tag">
            <Globe2 size={16} aria-hidden="true" />
            {ui.audience}
          </p>
          <h1>
            {ui.headline[0]} <span>{ui.headline[1]}</span>
          </h1>
          <p className="hero-description">{ui.intro}</p>
          <div className="hero-actions">
            <Button onClick={() => go('upload')}>
              {t.upload}
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
            <Button variant="outline" onClick={() => go('result')}>
              {t.sample}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Button>
          </div>
          <p className="hero-disclosure">
            <ShieldCheck size={16} aria-hidden="true" />
            {t.notice}
          </p>
        </div>
        <div className="hero-visual">
          <section className="hero-preview" aria-label={t.sampleLabel}>
            <div className="preview-top">
              <span className="preview-icon">
                <FileText size={21} aria-hidden="true" />
              </span>
              <Badge tone="mint">{t.demoData}</Badge>
            </div>
            <p className="eyebrow">{t.summary}</p>
            <h2>{t.contractName}</h2>
            <div className="preview-list">
              {[t.deposit, t.fee, t.penalty].map((clause, index) => (
                <div key={clause} className="preview-row">
                  <span className="preview-indicator" aria-hidden="true">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <span>{clause}</span>
                  <Badge
                    tone={
                      ['danger', 'amber', 'green'][samples.mapo.levels[index]]
                    }
                  >
                    {copy.levels[samples.mapo.levels[index]]}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="preview-footer">
              <Check size={16} aria-hidden="true" />
              {t.sampleLabel}
            </div>
          </section>
          <div className="preview-stamp" aria-hidden="true">
            <ShieldCheck size={31} strokeWidth={1.6} />
          </div>
        </div>
      </section>
      <section className="home-section">
        <h2>{ui.sections[0]}</h2>
        <div className="home-grid">
          {steps.map(({ icon: Icon, page }, i) => (
            <button
              type="button"
              className="step card"
              onClick={() => go(page)}
              key={page}
            >
              <span className="feature-icon">
                <Icon size={21} aria-hidden="true" />
              </span>
              <span className="step-copy">
                <strong>{ui.steps[i]}</strong>
                <span>{ui.stepDetails[i]}</span>
              </span>
              <ArrowUpRight
                size={16}
                aria-hidden="true"
                className="step-arrow"
              />
            </button>
          ))}
        </div>
      </section>
      <section className="home-section">
        <h2>{ui.sections[1]}</h2>
        <div className="home-grid">
          {features.map(({ icon: Icon, page }, i) => (
            <button
              type="button"
              className="feature card"
              onClick={() => go(page)}
              key={page}
            >
              <Icon size={22} aria-hidden="true" />
              <strong>{ui.features[i]}</strong>
              <span>{ui.featureDetails[i]}</span>
              {page === 'checklist' && (
                <span className="progress-caption">
                  {checked} / {total} · {t.complete}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>
      <div className="home-section home-bottom">
        <Card className="recent">
          <div className="section-title">
            <h2>{hasHistory ? t.recent : copy.samples}</h2>
            <Button variant="text-link" onClick={() => go('contracts')}>
              {t.all}
              <ArrowRight size={15} aria-hidden="true" />
            </Button>
          </div>
          <div className="contract-list">{recent}</div>
        </Card>
        <Card className="scope">
          <h2>{ui.sections[2]}</h2>
          <p>{ui.scenario}</p>
          <div className="scope-note">
            <CircleHelp size={18} aria-hidden="true" />
            <div>
              <strong>{ui.scope}</strong>
              <p>{t.notice}</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
