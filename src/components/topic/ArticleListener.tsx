import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Headphones, Play, Pause, SkipBack, SkipForward, X, Minus, Plus, LocateFixed, Mic2 } from 'lucide-react';
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
const FOLLOW_KEY = 'eng_hub_tts_follow';
const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const MAX_CHUNK_LENGTH = 220; // long utterances get cut off in some browsers
const WORDS_PER_SECOND = 2.6; // at 1×, used to estimate position when the voice sends no word events
const USER_SCROLL_PAUSE_MS = 6000;

const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
const hasHighlightApi = typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined';

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


function readStored(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Read-along highlighting. Spoken words are matched to the rendered article's
// text and painted with the CSS Custom Highlight API, so React's DOM is never
// mutated. Styles: ::highlight(tts-word) / ::highlight(tts-sentence) in index.css.
// ---------------------------------------------------------------------------

interface Token {
  start: number;
  norm: string;
}

interface ChunkAlignment {
  tokens: Token[];
  ranges: (Range | null)[];
  sentence: Range | null;
}

interface SectionAlignment {
  sectionIndex: number;
  root: HTMLElement;
  map: Map<number, ChunkAlignment>;
  dirty: boolean;
  observer: MutationObserver;
}

const SKIP_SELECTOR = 'pre, button, svg, script, style, textarea, input, select, [data-tts-skip]';
const MATCH_WINDOW = 30; // how far ahead a spoken word may be searched for in the page text

const normalizeWord = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

function tokenize(text: string): Token[] {
  return Array.from(text.matchAll(/\S+/g), (m) => ({ start: m.index ?? 0, norm: normalizeWord(m[0]) }));
}

function collectDomWords(root: HTMLElement): { norm: string; range: Range }[] {
  const words: { norm: string; range: Range }[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.nodeValue?.trim() && !node.parentElement?.closest(SKIP_SELECTOR) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
  });
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    for (const m of (node.nodeValue || '').matchAll(/\S+/g)) {
      const norm = normalizeWord(m[0]);
      if (!norm) continue;
      const range = document.createRange();
      range.setStart(node, m.index ?? 0);
      range.setEnd(node, (m.index ?? 0) + m[0].length);
      words.push({ norm, range });
    }
  }
  return words;
}

/** Aligns every chunk of one section to that section's rendered words, in reading order. */
function alignSection(root: HTMLElement, chunks: SpeechChunk[], sectionIndex: number): Map<number, ChunkAlignment> {
  const dom = collectDomWords(root);
  const result = new Map<number, ChunkAlignment>();
  let cursor = 0;
  chunks.forEach((chunk, chunkIndex) => {
    if (chunk.sectionIndex !== sectionIndex) return;
    const tokens = tokenize(chunk.text);
    const ranges = tokens.map((t) => {
      if (!t.norm) return null;
      const end = Math.min(dom.length, cursor + MATCH_WINDOW);
      for (let j = cursor; j < end; j++) {
        if (dom[j].norm === t.norm) {
          cursor = j + 1;
          return dom[j].range;
        }
      }
      return null; // spoken-only words such as "Question:" or "Code example."
    });
    const matched = ranges.filter((r): r is Range => r !== null);
    let sentence: Range | null = null;
    if (matched.length > 0) {
      const last = matched[matched.length - 1];
      sentence = document.createRange();
      sentence.setStart(matched[0].startContainer, matched[0].startOffset);
      sentence.setEnd(last.endContainer, last.endOffset);
    }
    result.set(chunkIndex, { tokens, ranges, sentence });
  });
  return result;
}

function setHighlight(name: 'tts-word' | 'tts-sentence', range: Range | null): void {
  if (!hasHighlightApi) return;
  if (range) CSS.highlights.set(name, new Highlight(range));
  else CSS.highlights.delete(name);
}

const Equalizer: React.FC<{ active: boolean; className?: string }> = ({ active, className = '' }) => (
  <span className={`tts-eq ${className}`} data-active={active} aria-hidden="true">
    {[0, 1, 2, 3].map((i) => (
      <span key={i} className="tts-eq-bar" style={{ animationDelay: `${i * -0.23}s` }} />
    ))}
  </span>
);

export const ArticleListener: React.FC<ArticleListenerProps> = ({ topicTitle, sections, onActiveSectionChange }) => {
  const chunks = useMemo(() => buildChunks(topicTitle, sections), [topicTitle, sections]);
  const chunkWordCounts = useMemo(() => chunks.map((c) => tokenize(c.text).length), [chunks]);

  const [state, setState] = useState<PlaybackState>('idle');
  const [index, setIndex] = useState(0);
  const [wordFraction, setWordFraction] = useState(0);
  const [rate, setRate] = useState<number>(readStoredRate);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>(() => readStored(VOICE_KEY, ''));
  const [follow, setFollow] = useState<boolean>(() => readStored(FOLLOW_KEY, 'true') !== 'false');

  // Each speakFrom() gets a new token so callbacks from cancelled utterances are ignored.
  const tokenRef = useRef(0);
  const settingsRef = useRef({ rate, voiceURI, voices, chunks, sections, follow });
  settingsRef.current = { rate, voiceURI, voices, chunks, sections, follow };

  const alignmentRef = useRef<SectionAlignment | null>(null);
  const lastWordRef = useRef<{ chunk: number; word: number; range: Range | null }>({ chunk: -1, word: -1, range: null });
  const boundaryWorksRef = useRef(false); // voice reports word positions, so no need to estimate
  const userScrollUntilRef = useRef(0);
  const estimateTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isSupported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  // Article edited while listening: re-align on next use.
  useEffect(() => {
    if (alignmentRef.current) alignmentRef.current.dirty = true;
  }, [chunks]);

  const resetHighlights = useCallback(() => {
    setHighlight('tts-word', null);
    setHighlight('tts-sentence', null);
    alignmentRef.current?.observer.disconnect();
    alignmentRef.current = null;
    lastWordRef.current = { chunk: -1, word: -1, range: null };
  }, []);

  const getAlignment = useCallback((chunkIndex: number): ChunkAlignment | undefined => {
    const { chunks: list, sections: secs } = settingsRef.current;
    const chunk = list[chunkIndex];
    if (!chunk || !hasHighlightApi) return undefined;
    const sectionId = secs[chunk.sectionIndex]?.id;
    const root = sectionId ? document.getElementById(`art-sec-${sectionId}`) : null;
    if (!root) return undefined;

    let a = alignmentRef.current;
    if (!a || a.sectionIndex !== chunk.sectionIndex || a.root !== root || a.dirty) {
      a?.observer.disconnect();
      // Expanding Q&A blocks or re-renders change the text nodes; realign lazily when that happens.
      const observer = new MutationObserver(() => {
        if (alignmentRef.current) alignmentRef.current.dirty = true;
      });
      observer.observe(root, { childList: true, subtree: true, characterData: true });
      a = { sectionIndex: chunk.sectionIndex, root, map: alignSection(root, list, chunk.sectionIndex), dirty: false, observer };
      alignmentRef.current = a;
    }
    return a.map.get(chunkIndex);
  }, []);

  const followTarget = useCallback((target: Range | HTMLElement, force = false) => {
    if (!force && (!settingsRef.current.follow || Date.now() < userScrollUntilRef.current)) return;
    const rect = target.getBoundingClientRect();
    if (!rect.height) return; // hidden (e.g. collapsed)
    if (force || rect.top < 120 || rect.bottom > window.innerHeight - 210) {
      window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight * 0.35, behavior: 'smooth' });
    }
  }, []);

  const showWord = useCallback(
    (chunkIndex: number, wordIndex: number) => {
      const last = lastWordRef.current;
      if (last.chunk === chunkIndex && last.word === wordIndex) return;
      const count = settingsRef.current.chunks[chunkIndex] ? tokenize(settingsRef.current.chunks[chunkIndex].text).length : 0;
      setWordFraction(count ? wordIndex / count : 0);

      const range = getAlignment(chunkIndex)?.ranges[wordIndex] ?? null;
      lastWordRef.current = { chunk: chunkIndex, word: wordIndex, range: range ?? last.range };
      if (range) {
        setHighlight('tts-word', range);
        followTarget(range);
      }
    },
    [getAlignment, followTarget]
  );

  const startChunkHighlight = useCallback(
    (chunkIndex: number) => {
      const { chunks: list, sections: secs } = settingsRef.current;
      const alignment = getAlignment(chunkIndex);
      setHighlight('tts-sentence', alignment?.sentence ?? null);
      if (!alignment?.ranges.some(Boolean)) setHighlight('tts-word', null);

      // Nothing on the page matches (e.g. spoken-only text): at least keep its section in view.
      const isSectionStart = chunkIndex === 0 || list[chunkIndex - 1]?.sectionIndex !== list[chunkIndex]?.sectionIndex;
      if (!alignment?.sentence && isSectionStart) {
        const el = document.getElementById(`art-sec-${secs[list[chunkIndex]?.sectionIndex]?.id}`);
        if (el) followTarget(el);
      }
      showWord(chunkIndex, 0);
    },
    [getAlignment, followTarget, showWord]
  );

  const finish = useCallback(() => {
    window.clearInterval(estimateTimerRef.current);
    setState('idle');
    setIndex(0);
    setWordFraction(0);
    resetHighlights();
  }, [resetHighlights]);

  const speakFrom = useCallback(
    (start: number) => {
      if (!isSupported) return;
      const synth = window.speechSynthesis;
      const token = ++tokenRef.current;
      synth.cancel();

      const speakChunk = (i: number) => {
        const { chunks: list, rate: r, voiceURI: uri, voices: vs } = settingsRef.current;
        if (token !== tokenRef.current) return;
        window.clearInterval(estimateTimerRef.current);
        if (i >= list.length) {
          finish();
          return;
        }

        setIndex(i);
        startChunkHighlight(i);

        const text = list[i].text;
        const tokens = tokenize(text);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = r;
        const voice = vs.find((v) => v.voiceURI === uri);
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        }

        let gotBoundary = false;
        utterance.onboundary = (e) => {
          if (token !== tokenRef.current || (e.name && e.name !== 'word')) return;
          gotBoundary = true;
          boundaryWorksRef.current = true;
          window.clearInterval(estimateTimerRef.current);
          let w = 0;
          while (w + 1 < tokens.length && tokens[w + 1].start <= e.charIndex) w++;
          showWord(i, w);
        };
        // Some voices (e.g. Chrome's online Google voices) never report word positions: estimate from elapsed time.
        utterance.onstart = () => {
          if (token !== tokenRef.current || boundaryWorksRef.current) return;
          const startedAt = performance.now();
          estimateTimerRef.current = window.setInterval(() => {
            if (gotBoundary || token !== tokenRef.current) {
              window.clearInterval(estimateTimerRef.current);
              return;
            }
            const elapsed = (performance.now() - startedAt) / 1000;
            showWord(i, Math.min(tokens.length - 1, Math.floor(elapsed * WORDS_PER_SECOND * r)));
          }, 150);
        };
        utterance.onend = () => speakChunk(i + 1);
        utterance.onerror = (e) => {
          if (e.error === 'interrupted' || e.error === 'canceled') return;
          speakChunk(i + 1);
        };
        synth.speak(utterance);
      };

      setState('playing');
      speakChunk(start);
    },
    [finish, startChunkHighlight, showWord]
  );

  const stop = useCallback(() => {
    tokenRef.current++;
    if (isSupported) window.speechSynthesis.cancel();
    finish();
  }, [finish]);

  // Pause is cancel + remember position: native pause() is unreliable on mobile and Chrome.
  const pause = useCallback(() => {
    tokenRef.current++;
    window.clearInterval(estimateTimerRef.current);
    window.speechSynthesis.cancel();
    setState('paused');
  }, []);

  // Stop when leaving the topic.
  useEffect(
    () => () => {
      tokenRef.current++;
      window.clearInterval(estimateTimerRef.current);
      if (isSupported) window.speechSynthesis.cancel();
      resetHighlights();
    },
    [resetHighlights]
  );

  const isActive = state !== 'idle';

  // Manual scrolling temporarily takes over from follow-along.
  useEffect(() => {
    if (!isActive) return;
    const onUserScroll = () => {
      userScrollUntilRef.current = Date.now() + USER_SCROLL_PAUSE_MS;
    };
    const onKey = (e: KeyboardEvent) => {
      if (['PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) onUserScroll();
    };
    window.addEventListener('wheel', onUserScroll, { passive: true });
    window.addEventListener('touchmove', onUserScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    // Leave room so the floating player never covers the end of the article.
    document.body.style.paddingBottom = '10rem';
    return () => {
      window.removeEventListener('wheel', onUserScroll);
      window.removeEventListener('touchmove', onUserScroll);
      window.removeEventListener('keydown', onKey);
      document.body.style.paddingBottom = '';
    };
  }, [isActive]);

  const currentSection = chunks[index]?.sectionIndex ?? 0;
  const activeSectionId = isActive ? sections[currentSection]?.id : undefined;
  useEffect(() => {
    onActiveSectionChange?.(activeSectionId);
  }, [activeSectionId, onActiveSectionChange]);
  useEffect(() => () => onActiveSectionChange?.(undefined), [onActiveSectionChange]);

  const goToChunk = (target: number) => {
    const clamped = Math.max(0, Math.min(chunks.length - 1, target));
    if (state === 'playing') {
      speakFrom(clamped);
    } else {
      setIndex(clamped);
      setState('paused');
      startChunkHighlight(clamped);
    }
  };

  const jumpToSection = (sectionIndex: number) => {
    const target = chunks.findIndex((c) => c.sectionIndex === sectionIndex);
    if (target !== -1) goToChunk(target);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    userScrollUntilRef.current = 0;
    goToChunk(Math.floor(fraction * chunks.length));
  };

  const changeRate = (value: number) => {
    if (!RATES.includes(value)) return;
    setRate(value);
    writeStored(RATE_KEY, String(value));
    settingsRef.current.rate = value;
    if (state === 'playing') speakFrom(index); // apply immediately
  };

  const changeVoice = (uri: string) => {
    setVoiceURI(uri);
    writeStored(VOICE_KEY, uri);
    settingsRef.current.voiceURI = uri;
    boundaryWorksRef.current = false; // the new voice may not report word positions
    if (state === 'playing') speakFrom(index);
  };

  const toggleFollow = () => {
    const next = !follow;
    setFollow(next);
    writeStored(FOLLOW_KEY, String(next));
    settingsRef.current.follow = next;
    if (next) {
      userScrollUntilRef.current = 0;
      const range = lastWordRef.current.range;
      if (range) followTarget(range, true);
    }
  };

  if (!isSupported || chunks.length === 0) return null;

  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const voiceOptions = englishVoices.length > 0 ? englishVoices : voices;
  const totalWords = chunkWordCounts.reduce((n, c) => n + c, 0);
  const wordsDone = chunkWordCounts.slice(0, index).reduce((n, c) => n + c, 0) + wordFraction * (chunkWordCounts[index] || 0);
  const progress = isActive ? Math.min(100, (wordsDone / Math.max(totalWords, 1)) * 100) : 0;
  const secondsLeft = (totalWords - wordsDone) / (WORDS_PER_SECOND * rate);
  const totalMinutes = Math.max(1, Math.round(totalWords / (WORDS_PER_SECOND * rate) / 60));
  const isPlaying = state === 'playing';
  const rateIndex = RATES.indexOf(rate);

  const gradientButton =
    'relative grid place-items-center rounded-full bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer';
  const iconButton =
    'p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors';

  const player = (
    <div className="fixed inset-x-0 bottom-3 sm:bottom-5 z-40 flex justify-center px-3 pointer-events-none print:hidden">
      <div className="tts-enter pointer-events-auto w-full max-w-3xl" role="region" aria-label="Article audio player">
        <div className="tts-gradient-border rounded-2xl p-[1.5px] shadow-2xl shadow-indigo-500/25" data-paused={!isPlaying}>
          <div className="rounded-[15px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-3 sm:px-4 pt-3 pb-2.5">
            {/* Title row */}
            <div className="flex items-center gap-3">
              <button
                onClick={isPlaying ? pause : () => speakFrom(index)}
                className={`${gradientButton} w-11 h-11 shrink-0 ${isPlaying ? 'tts-pulse' : ''}`}
                title={isPlaying ? 'Pause' : 'Resume'}
                aria-label={isPlaying ? 'Pause' : 'Resume'}
              >
                {isPlaying ? <Pause className="w-5 h-5 relative" /> : <Play className="w-5 h-5 ml-0.5 relative" />}
              </button>
  
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  <Equalizer active={isPlaying} />
                  <span>{isPlaying ? 'Now reading' : 'Paused'}</span>
                  <span className="text-slate-400">
                    § {currentSection + 1}/{sections.length}
                  </span>
                </div>
                <p className="text-sm font-semibold truncate text-slate-900 dark:text-white" title={sections[currentSection]?.title}>
                  {sections[currentSection]?.title}
                </p>
              </div>
  
              <div className="flex items-center">
                <button onClick={() => jumpToSection(currentSection - 1)} disabled={currentSection === 0} className={iconButton} title="Previous section">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => jumpToSection(currentSection + 1)}
                  disabled={currentSection >= sections.length - 1}
                  className={iconButton}
                  title="Next section"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button onClick={stop} className={iconButton} title="Stop and close player">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
  
            {/* Progress (click to seek) */}
            <div className="mt-2.5 flex items-center gap-2.5">
              <div
                onClick={seek}
                className="group relative flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 cursor-pointer"
                title="Jump to position"
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-400 transition-[width] duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="absolute top-1/2 w-3 h-3 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white ring-2 ring-fuchsia-500 shadow transition-[left] duration-300 ease-out group-hover:scale-125"
                  style={{ left: `${progress}%` }}
                />
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">-{formatDuration(secondsLeft)}</span>
            </div>
  
            {/* Settings row */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                <button onClick={() => changeRate(RATES[rateIndex - 1])} disabled={rateIndex <= 0} className={iconButton} title="Slower">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-12 text-center text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200" title="Playback speed">
                  {rate}×
                </span>
                <button onClick={() => changeRate(RATES[rateIndex + 1])} disabled={rateIndex >= RATES.length - 1} className={iconButton} title="Faster">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
  
              {voiceOptions.length > 1 && (
                <label className="flex items-center gap-1.5 pl-2.5 pr-1 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 min-w-0">
                  <Mic2 className="w-3.5 h-3.5 shrink-0" />
                  <select
                    value={voiceURI}
                    onChange={(e) => changeVoice(e.target.value)}
                    className="bg-transparent text-xs text-slate-700 dark:text-slate-200 py-1 pr-1 max-w-[150px] sm:max-w-[220px] focus:outline-hidden cursor-pointer"
                    title="Voice"
                  >
                    <option value="">Default voice</option>
                    {voiceOptions.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
  
              <button
                onClick={toggleFollow}
                aria-pressed={follow}
                className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  follow
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600'
                }`}
                title="Scroll the article to follow the voice"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                <span>Follow</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Inline entry point inside the article */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50 via-white to-fuchsia-50 dark:from-indigo-950/60 dark:via-slate-900 dark:to-fuchsia-950/30 p-3 sm:p-4 flex items-center gap-3 sm:gap-4 print:hidden">
        <button
          onClick={isPlaying ? pause : () => speakFrom(index)}
          className={`${gradientButton} w-11 h-11 shrink-0 ${isPlaying ? 'tts-pulse' : ''}`}
          aria-label={isPlaying ? 'Pause' : isActive ? 'Resume' : 'Listen to this article'}
        >
          {isPlaying ? <Pause className="w-5 h-5 relative" /> : isActive ? <Play className="w-5 h-5 ml-0.5 relative" /> : <Headphones className="w-5 h-5 relative" />}
        </button>
        <div className="min-w-0 flex-1">
          {isActive ? (
            <>
              <p className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Equalizer active={isPlaying} className="text-indigo-600 dark:text-indigo-400" />
                <span>{isPlaying ? 'Listening…' : 'Paused'}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Controls are in the player at the bottom of the screen.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Listen to this article</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                About {totalMinutes} min at {rate}× · words are highlighted as they are read
              </p>
            </>
          )}
        </div>
      </div>

      {isActive && createPortal(player, document.body)}
    </>
  );
};
