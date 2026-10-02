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
const WORDS_PER_SECOND = 2.6; // at 1×, used for time estimates
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

/**
 * Default voice when the user has not picked one: prefer voices that report word
 * positions (Edge "Natural" voices, then locally installed voices). Chrome's online
 * "Google" voices speak well but send no word events, so read-along can't follow them.
 */
function pickDefaultVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  return english.find((v) => /natural/i.test(v.name)) ?? english.find((v) => v.localService) ?? english[0];
}

/**
 * SpeechSynthesisEvent.elapsedTime is seconds per spec but milliseconds in some browsers.
 * Pick the unit that best matches a rough estimate (~14 characters per second at 1×).
 */
function boundaryElapsedMs(e: SpeechSynthesisEvent, rate: number): number {
  const t = e.elapsedTime || 0;
  if (t <= 0) return 0;
  const estimateSec = e.charIndex / (14 * rate);
  return Math.abs(t - estimateSec) <= Math.abs(t / 1000 - estimateSec) ? t * 1000 : t;
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
const MATCH_WINDOW = 30; // greedy fallback: how far ahead a spoken word may be searched for
const MAX_LCS_CELLS = 6_000_000; // spoken × page words; above this use the greedy fallback

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

/** Greedy fallback for very large sections: match each word within a small look-ahead window. */
function greedyAlign(spoken: string[], page: string[]): Int32Array {
  const result = new Int32Array(spoken.length).fill(-1);
  let cursor = 0;
  spoken.forEach((word, i) => {
    const end = Math.min(page.length, cursor + MATCH_WINDOW);
    for (let j = cursor; j < end; j++) {
      if (page[j] === word) {
        result[i] = j;
        cursor = j + 1;
        return;
      }
    }
  });
  return result;
}

/**
 * Longest-common-subsequence alignment of spoken words to page words. Unlike a greedy
 * search it never lets a common word ("the", "a") latch onto a later occurrence and
 * drag the highlight ahead of the voice. Returns the page index per spoken word, or -1.
 */
export function alignWords(spoken: string[], page: string[]): Int32Array {
  const n = spoken.length;
  const m = page.length;
  if (n === 0 || m === 0) return new Int32Array(n).fill(-1);
  if (n * m > MAX_LCS_CELLS) return greedyAlign(spoken, page);

  // Intern words so the inner loop compares integers.
  const ids = new Map<string, number>();
  const intern = (w: string) => ids.get(w) ?? (ids.set(w, ids.size), ids.size - 1);
  const a = Int32Array.from(spoken, intern);
  const b = Int32Array.from(page, intern);

  // dp[i][j] = LCS length of a[i..] and b[j..], filled from the end so traceback runs forwards.
  const w = m + 1;
  const dp = new Uint16Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * w + j] = a[i] === b[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
    }
  }

  const result = new Int32Array(n).fill(-1);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      result[i++] = j++;
    } else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) {
      i++; // spoken-only word ("Question:", "Code example.")
    } else {
      j++; // page-only word (skipped code, UI labels)
    }
  }
  return result;
}

/** Aligns every chunk of one section to that section's rendered words, in reading order. */
function alignSection(root: HTMLElement, chunks: SpeechChunk[], sectionIndex: number): Map<number, ChunkAlignment> {
  const dom = collectDomWords(root);
  const result = new Map<number, ChunkAlignment>();
  const spoken: { chunkIndex: number; tokenIndex: number; norm: string }[] = [];

  chunks.forEach((chunk, chunkIndex) => {
    if (chunk.sectionIndex !== sectionIndex) return;
    const tokens = tokenize(chunk.text);
    result.set(chunkIndex, { tokens, ranges: tokens.map(() => null), sentence: null });
    tokens.forEach((t, tokenIndex) => {
      if (t.norm) spoken.push({ chunkIndex, tokenIndex, norm: t.norm });
    });
  });

  const match = alignWords(
    spoken.map((s) => s.norm),
    dom.map((d) => d.norm)
  );
  spoken.forEach((s, k) => {
    if (match[k] >= 0) result.get(s.chunkIndex)!.ranges[s.tokenIndex] = dom[match[k]].range;
  });

  for (const alignment of result.values()) {
    const matched = alignment.ranges.filter((r): r is Range => r !== null);
    if (matched.length === 0) continue;
    const last = matched[matched.length - 1];
    const sentence = document.createRange();
    sentence.setStart(matched[0].startContainer, matched[0].startOffset);
    sentence.setEnd(last.endContainer, last.endOffset);
    alignment.sentence = sentence;
  }
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
  const markerRef = useRef<HTMLDivElement | null>(null);
  const userScrollUntilRef = useRef(0);
  const lastAutoScrollRef = useRef(0);
  const wordTimersRef = useRef<number[]>([]);
  const clearWordTimers = useCallback(() => {
    wordTimersRef.current.forEach((t) => window.clearTimeout(t));
    wordTimersRef.current = [];
  }, []);
  // null = not known yet, false = the voice sends no word events (sentence highlight only).
  const [wordTracking, setWordTracking] = useState<boolean | null>(null);
  const wordTrackingRef = useRef<boolean | null>(null);

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

  /** Moves the gliding word marker onto a range (hides it for null). */
  const placeMarker = useCallback((range: Range | null) => {
    const el = markerRef.current;
    if (!el) return;
    const rect = range?.getClientRects()[0];
    if (!rect || !rect.width) {
      el.style.opacity = '0';
      el.dataset.visible = '';
      return;
    }
    const x = rect.left + window.scrollX - 3;
    const y = rect.top + window.scrollY - 2;
    // Glide between neighbouring words; jump (no transition) when appearing or changing line.
    const prevY = parseFloat(el.dataset.y || 'NaN');
    const jump = el.dataset.visible !== '1' || !(Math.abs(prevY - y) <= rect.height * 1.5);
    if (jump) el.style.transition = 'none';
    el.style.width = `${rect.width + 6}px`;
    el.style.height = `${rect.height + 4}px`;
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.style.opacity = '1';
    el.dataset.visible = '1';
    el.dataset.y = String(y);
    if (jump) {
      void el.offsetWidth; // apply the jump before re-enabling the transition
      el.style.transition = '';
    }
  }, []);

  const resetHighlights = useCallback(() => {
    setHighlight('tts-sentence', null);
    placeMarker(null);
    alignmentRef.current?.observer.disconnect();
    alignmentRef.current = null;
    lastWordRef.current = { chunk: -1, word: -1, range: null };
  }, [placeMarker]);

  const getAlignment = useCallback((chunkIndex: number): ChunkAlignment | undefined => {
    const { chunks: list, sections: secs } = settingsRef.current;
    const chunk = list[chunkIndex];
    if (!chunk) return undefined;
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

  /** Scrolls so the target sits ~30% from the top, at most once per smooth-scroll animation. */
  const followTarget = useCallback((target: Range | HTMLElement, force = false) => {
    if (!force && (!settingsRef.current.follow || Date.now() < userScrollUntilRef.current)) return;
    if (!force && Date.now() - lastAutoScrollRef.current < 900) return;
    const rect = target.getBoundingClientRect();
    if (!rect.height) return; // hidden (e.g. collapsed)
    if (force || rect.top < 110 || rect.bottom > window.innerHeight - 220) {
      lastAutoScrollRef.current = Date.now();
      window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight * 0.3, behavior: 'smooth' });
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
        placeMarker(range);
        followTarget(range); // long sentences that run off the bottom
      }
    },
    [getAlignment, followTarget, placeMarker]
  );

  const startChunkHighlight = useCallback(
    (chunkIndex: number) => {
      const { chunks: list, sections: secs } = settingsRef.current;
      const alignment = getAlignment(chunkIndex);
      setHighlight('tts-sentence', alignment?.sentence ?? null);
      lastWordRef.current = { chunk: chunkIndex, word: -1, range: null };

      if (alignment?.sentence) {
        followTarget(alignment.sentence);
      } else {
        // Nothing on the page matches (spoken-only text): at least keep its section in view.
        const isSectionStart = chunkIndex === 0 || list[chunkIndex - 1]?.sectionIndex !== list[chunkIndex]?.sectionIndex;
        const el = document.getElementById(`art-sec-${secs[list[chunkIndex]?.sectionIndex]?.id}`);
        if (isSectionStart && el) followTarget(el);
      }

      // Park the marker on the first matched word until the voice reports positions.
      const first = alignment?.ranges.find(Boolean) ?? null;
      placeMarker(wordTrackingRef.current === false ? null : first);
    },
    [getAlignment, followTarget, placeMarker]
  );

  const finish = useCallback(() => {
    clearWordTimers();
    setState('idle');
    setIndex(0);
    setWordFraction(0);
    resetHighlights();
  }, [resetHighlights, clearWordTimers]);

  const speakFrom = useCallback(
    (start: number) => {
      if (!isSupported) return;
      const synth = window.speechSynthesis;
      const token = ++tokenRef.current;
      clearWordTimers();
      synth.cancel();

      const speakChunk = (i: number) => {
        const { chunks: list, rate: r, voiceURI: uri, voices: vs } = settingsRef.current;
        if (token !== tokenRef.current) return;
        if (i >= list.length) {
          finish();
          return;
        }

        clearWordTimers();
        setIndex(i);
        startChunkHighlight(i);

        const text = list[i].text;
        const tokens = tokenize(text);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = r;
        const voice = vs.find((v) => v.voiceURI === uri) ?? pickDefaultVoice(vs);
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        }

        let gotBoundary = false;
        // Audio clock for this utterance. Events that arrive before playback starts are
        // held until onstart so they are timed from when the audio really begins.
        let startedAt = 0;
        const early: { word: number; elapsedMs: number }[] = [];
        const scheduleWord = (word: number, elapsedMs: number) => {
          const dueMs = startedAt + elapsedMs - performance.now();
          if (dueMs > 40 && dueMs < 15000) {
            wordTimersRef.current.push(
              window.setTimeout(() => {
                if (token === tokenRef.current) showWord(i, word);
              }, dueMs)
            );
          } else {
            showWord(i, word);
          }
        };
        utterance.onstart = () => {
          if (token !== tokenRef.current) return;
          startedAt = performance.now();
          early.splice(0).forEach((ev) => scheduleWord(ev.word, ev.elapsedMs));
        };
        utterance.onboundary = (e) => {
          if (token !== tokenRef.current || (e.name && e.name !== 'word')) return;
          if (wordTrackingRef.current !== true) {
            wordTrackingRef.current = true;
            setWordTracking(true);
          }
          gotBoundary = true;
          let w = 0;
          while (w + 1 < tokens.length && tokens[w + 1].start <= e.charIndex) w++;

          // Some voices (notably Edge's online "Natural" voices) deliver word events
          // before the audio reaches them. elapsedTime says when the word is spoken,
          // so wait for that moment instead of highlighting immediately.
          const elapsedMs = boundaryElapsedMs(e, r);
          if (startedAt === 0) early.push({ word: w, elapsedMs });
          else scheduleWord(w, elapsedMs);
        };
        utterance.onend = () => {
          clearWordTimers();
          // A short utterance may end before any event arrives; only judge longer ones.
          if (!gotBoundary && tokens.length >= 4 && wordTrackingRef.current === null) {
            wordTrackingRef.current = false;
            setWordTracking(false);
            placeMarker(null);
          }
          speakChunk(i + 1);
        };
        utterance.onerror = (e) => {
          if (e.error === 'interrupted' || e.error === 'canceled') return;
          speakChunk(i + 1);
        };
        synth.speak(utterance);
      };

      setState('playing');
      speakChunk(start);
    },
    [finish, startChunkHighlight, showWord, placeMarker, clearWordTimers]
  );

  const stop = useCallback(() => {
    tokenRef.current++;
    if (isSupported) window.speechSynthesis.cancel();
    finish();
  }, [finish]);

  // Pause is cancel + remember position: native pause() is unreliable on mobile and Chrome.
  const pause = useCallback(() => {
    tokenRef.current++;
    clearWordTimers();
    window.speechSynthesis.cancel();
    setState('paused');
  }, [clearWordTimers]);

  // Stop when leaving the topic.
  useEffect(
    () => () => {
      tokenRef.current++;
      clearWordTimers();
      if (isSupported) window.speechSynthesis.cancel();
      resetHighlights();
    },
    [resetHighlights, clearWordTimers]
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

  // Keep the word marker on its word when the layout changes size.
  useEffect(() => {
    if (!isActive) return;
    const onResize = () => placeMarker(lastWordRef.current.range);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isActive, placeMarker]);

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
    // The new voice may not report word positions; detect again.
    wordTrackingRef.current = null;
    setWordTracking(null);
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
                    <option value="">Auto (best for highlighting)</option>
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

            {wordTracking === false && (
              <p className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                This voice doesn't report word positions, so only the sentence is highlighted. Pick a Microsoft or
                &ldquo;Natural&rdquo; voice (or Auto) for word-by-word highlighting.
              </p>
            )}
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

      {isActive &&
        createPortal(
          <>
            <div ref={markerRef} className="tts-word-marker" aria-hidden="true" />
            {player}
          </>,
          document.body
        )}
    </>
  );
};
