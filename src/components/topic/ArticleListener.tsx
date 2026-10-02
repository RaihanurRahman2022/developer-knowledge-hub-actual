import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Headphones, Play, Pause, Square, SkipBack, SkipForward } from 'lucide-react';
import { ArticleBlock, ArticleContentSection } from '../../types';

interface ArticleListenerProps {
  topicTitle: string;
  sections: ArticleContentSection[];
  /** Called with the section currently being read (undefined when stopped). */
  onActiveSectionChange?: (sectionId: string | undefined) => void;
}

interface SpeechChunk {
  sectionIndex: number;
  text: string;
}

type PlaybackState = 'idle' | 'playing' | 'paused';

const RATE_KEY = 'eng_hub_tts_rate';
const VOICE_KEY = 'eng_hub_tts_voice';
const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const MAX_CHUNK_LENGTH = 220; // long utterances get cut off in some browsers

const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Converts markdown to plain prose suitable for speech. */
function markdownToSpeech(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ') // code fences and ASCII diagrams
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links -> text
    .replace(/^\s*\|?\s*:?-{2,}.*$/gm, ' ') // table separator rows
    .replace(/^\s*\|(.*)\|\s*$/gm, (_m, row: string) => row.split('|').map((c) => c.trim()).filter(Boolean).join(', ') + '.')
    .replace(/<[^>]+>/g, ' ') // html tags
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/^\s*>\s?/gm, '') // blockquotes
    .replace(/^\s*[-*+]\s+/gm, '') // bullets
    .replace(/(\*\*|\*|~~)(.+?)\1/g, '$2') // emphasis
    .replace(/(?<!\w)(__|_)(.+?)\1(?!\w)/g, '$2') // underscore emphasis, keeps snake_case
    .replace(/^\s*-{3,}\s*$/gm, ' ') // horizontal rules
    .replace(/[─│┌┐└┘├┤┬┴┼═║╔╗╚╝►◄▲▼➔→←↑↓]+/g, ' ') // box drawing / arrows
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function blockToSpeech(block: ArticleBlock): string {
  switch (block.type) {
    case 'text':
      return markdownToSpeech(block.text || '');
    case 'code':
      // Generated titles like "2. Syntax Code Snippet" add nothing when spoken.
      return block.codeTitle && !/code snippet$/i.test(block.codeTitle) ? `Code example: ${block.codeTitle}.` : 'Code example.';
    case 'image':
      return [block.imageTitle, block.imageCaption].filter(Boolean).join('. ');
    case 'diagram':
      return [block.diagramTitle && `Diagram: ${block.diagramTitle}`, block.diagramCaption].filter(Boolean).join('. ');
    case 'callout':
      return [block.calloutTitle, markdownToSpeech(block.calloutContent || '')].filter(Boolean).join('. ');
    case 'link':
      return block.linkTitle ? `Reference: ${block.linkTitle}.` : '';
    case 'question':
      return [
        block.question && `Question: ${markdownToSpeech(block.question)}`,
        block.shortAnswer && `Short answer: ${markdownToSpeech(block.shortAnswer)}`,
        block.detailedAnswer && `Detailed answer: ${markdownToSpeech(block.detailedAnswer)}`,
        block.tips && `Interviewer tip: ${markdownToSpeech(block.tips)}`,
      ]
        .filter(Boolean)
        .join('\n');
    case 'accordion':
      return [block.accordionTitle, markdownToSpeech(block.accordionContent || '')].filter(Boolean).join('. ');
    case 'checklist':
      return block.checklistText || '';
    default:
      return '';
  }
}

/** Splits text into sentence-sized pieces no longer than MAX_CHUNK_LENGTH. */
function splitIntoChunks(text: string): string[] {
  // Split after sentence punctuation followed by whitespace, so "inserted.id" stays intact.
  const sentences = text.split(/(?<=[.!?])\s+|\n+/);
  const chunks: string[] = [];
  let current = '';
  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;
    if ((current + ' ' + sentence).length > MAX_CHUNK_LENGTH && current) {
      chunks.push(current);
      current = '';
    }
    if (sentence.length > MAX_CHUNK_LENGTH) {
      // Very long sentence: break on commas / spaces.
      const words = sentence.split(/\s+/);
      for (const word of words) {
        if ((current + ' ' + word).length > MAX_CHUNK_LENGTH && current) {
          chunks.push(current);
          current = '';
        }
        current = current ? `${current} ${word}` : word;
      }
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function buildChunks(topicTitle: string, sections: ArticleContentSection[]): SpeechChunk[] {
  const chunks: SpeechChunk[] = [];
  sections.forEach((sec, sectionIndex) => {
    const withStop = (t: string) => (/[.!?:]$/.test(t) ? t : `${t}.`);
    const title = withStop(sec.title.replace(/^\d+\.\s*/, ''));
    const parts = [sectionIndex === 0 ? `${withStop(topicTitle)} ${title}` : title];
    if (sec.blocks && sec.blocks.length > 0) {
      sec.blocks.forEach((b) => parts.push(blockToSpeech(b)));
    } else if (sec.content) {
      parts.push(markdownToSpeech(sec.content));
    }
    for (const part of parts) {
      for (const text of splitIntoChunks(part)) {
        chunks.push({ sectionIndex, text });
      }
    }
  });
  return chunks;
}

function readStoredRate(): number {
  try {
    const v = parseFloat(localStorage.getItem(RATE_KEY) || '');
    return RATES.includes(v) ? v : 1;
  } catch {
    return 1;
  }
}

export const ArticleListener: React.FC<ArticleListenerProps> = ({ topicTitle, sections, onActiveSectionChange }) => {
  const chunks = useMemo(() => buildChunks(topicTitle, sections), [topicTitle, sections]);

  const [state, setState] = useState<PlaybackState>('idle');
  const [index, setIndex] = useState(0);
  const [rate, setRate] = useState<number>(readStoredRate);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>(() => {
    try {
      return localStorage.getItem(VOICE_KEY) || '';
    } catch {
      return '';
    }
  });

  // Each speak() call gets a new token so callbacks from cancelled utterances are ignored.
  const tokenRef = useRef(0);
  const settingsRef = useRef({ rate, voiceURI, voices, chunks });
  settingsRef.current = { rate, voiceURI, voices, chunks };

  useEffect(() => {
    if (!isSupported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const stop = useCallback(() => {
    tokenRef.current++;
    if (isSupported) window.speechSynthesis.cancel();
    setState('idle');
    setIndex(0);
  }, []);

  // Stop when leaving the page.
  useEffect(() => () => {
    tokenRef.current++;
    if (isSupported) window.speechSynthesis.cancel();
  }, []);

  const speakFrom = useCallback((start: number) => {
    if (!isSupported) return;
    const synth = window.speechSynthesis;
    const token = ++tokenRef.current;
    synth.cancel();

    const speakChunk = (i: number) => {
      const { chunks: list, rate: r, voiceURI: uri, voices: vs } = settingsRef.current;
      if (token !== tokenRef.current) return;
      if (i >= list.length) {
        setState('idle');
        setIndex(0);
        return;
      }
      setIndex(i);
      const utterance = new SpeechSynthesisUtterance(list[i].text);
      utterance.rate = r;
      const voice = vs.find((v) => v.voiceURI === uri);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
      utterance.onend = () => speakChunk(i + 1);
      utterance.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        speakChunk(i + 1);
      };
      synth.speak(utterance);
    };

    setState('playing');
    speakChunk(start);
  }, []);

  // Pause is implemented as cancel + remember position: native pause() is unreliable on mobile/Chrome.
  const pause = () => {
    tokenRef.current++;
    window.speechSynthesis.cancel();
    setState('paused');
  };

  const currentSection = chunks[index]?.sectionIndex ?? 0;

  const jumpToSection = (sectionIndex: number) => {
    const target = chunks.findIndex((c) => c.sectionIndex === sectionIndex);
    if (target === -1) return;
    if (state === 'playing') speakFrom(target);
    else {
      setIndex(target);
      if (state === 'idle') setState('paused');
    }
  };

  const changeRate = (value: number) => {
    setRate(value);
    try {
      localStorage.setItem(RATE_KEY, String(value));
    } catch {
      // ignore
    }
    settingsRef.current.rate = value;
    if (state === 'playing') speakFrom(index); // apply immediately
  };

  const changeVoice = (uri: string) => {
    setVoiceURI(uri);
    try {
      localStorage.setItem(VOICE_KEY, uri);
    } catch {
      // ignore
    }
    settingsRef.current.voiceURI = uri;
    if (state === 'playing') speakFrom(index);
  };

  // Highlight and follow the section being read.
  const activeSectionId = state === 'idle' ? undefined : sections[currentSection]?.id;
  useEffect(() => {
    onActiveSectionChange?.(activeSectionId);
    if (activeSectionId && state === 'playing') {
      document.getElementById(`art-sec-${activeSectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSectionId]);

  useEffect(() => () => onActiveSectionChange?.(undefined), [onActiveSectionChange]);

  if (!isSupported || chunks.length === 0) return null;

  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const voiceOptions = englishVoices.length > 0 ? englishVoices : voices;
  const progress = Math.round((index / Math.max(chunks.length - 1, 1)) * 100);
  const totalWords = chunks.reduce((n, c) => n + c.text.split(/\s+/).length, 0);
  const minutes = Math.max(1, Math.round(totalWords / (160 * rate)));

  const iconButton =
    'p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer transition-colors';
  const selectClass =
    'px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer';

  return (
    <div className="sticky top-16 z-30 p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/95 dark:bg-indigo-950/80 backdrop-blur-xs shadow-2xs print:hidden">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {state === 'playing' ? (
          <button
            onClick={pause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={() => speakFrom(index)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
          >
            {state === 'idle' ? <Headphones className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{state === 'idle' ? 'Listen to Article' : 'Resume'}</span>
          </button>
        )}

        {state !== 'idle' && (
          <div className="flex items-center gap-0.5">
            <button onClick={() => jumpToSection(currentSection - 1)} disabled={currentSection === 0} className={iconButton} title="Previous section">
              <SkipBack className="w-4 h-4" />
            </button>
            <button onClick={stop} className={iconButton} title="Stop">
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => jumpToSection(currentSection + 1)}
              disabled={currentSection >= sections.length - 1}
              className={iconButton}
              title="Next section"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex-1 min-w-[140px] text-xs text-slate-600 dark:text-slate-300">
          {state === 'idle' ? (
            <span>About {minutes} min at {rate}×</span>
          ) : (
            <span className="truncate block">
              § {currentSection + 1}/{sections.length} — {sections[currentSection]?.title}
            </span>
          )}
        </div>

        <label className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <span>Speed</span>
          <select value={rate} onChange={(e) => changeRate(parseFloat(e.target.value))} className={selectClass}>
            {RATES.map((r) => (
              <option key={r} value={r}>
                {r}×
              </option>
            ))}
          </select>
        </label>

        {voiceOptions.length > 1 && (
          <select
            value={voiceURI}
            onChange={(e) => changeVoice(e.target.value)}
            className={`${selectClass} max-w-[160px]`}
            title="Voice"
          >
            <option value="">Default voice</option>
            {voiceOptions.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {state !== 'idle' && (
        <div className="mt-2 h-1 rounded-full bg-indigo-200/70 dark:bg-indigo-900 overflow-hidden">
          <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
};
