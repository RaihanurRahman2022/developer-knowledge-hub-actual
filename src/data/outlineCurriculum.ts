import { Section, Topic } from '../types';
import { parseMarkdownToArticleSections } from '../utils/markdownArticleParser';

/** Short id/slug prefix per subject, used to keep generated ids and slugs globally unique. */
const SUBJECT_PREFIX: Record<string, { id: string; slug: string; name: string }> = {
  'subj-go': { id: 'go', slug: 'go', name: 'Go' },
  'subj-nosql': { id: 'nosql', slug: 'mongodb', name: 'MongoDB' },
};

interface OutlineTopic {
  title: string;
  points: string[];
  notes: string[];
}

interface OutlineSection {
  subjectId: string;
  title: string;
  topics: OutlineTopic[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`$]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseOutline(markdown: string): OutlineSection[] {
  const sections: OutlineSection[] = [];
  let subjectId = '';
  let section: OutlineSection | undefined;
  let topic: OutlineTopic | undefined;

  const body = markdown.replace(/<!--[\s\S]*?-->/g, '');
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('### ')) {
      if (!section) throw new Error(`Outline topic "${line}" has no section`);
      topic = { title: line.slice(4).trim(), points: [], notes: [] };
      section.topics.push(topic);
    } else if (line.startsWith('## ')) {
      if (!subjectId) throw new Error(`Outline section "${line}" has no subject`);
      section = { subjectId, title: line.slice(3).trim(), topics: [] };
      sections.push(section);
      topic = undefined;
    } else if (line.startsWith('# ')) {
      subjectId = line.slice(2).trim();
      if (!SUBJECT_PREFIX[subjectId]) throw new Error(`Unknown outline subject "${subjectId}"`);
      section = undefined;
      topic = undefined;
    } else if (topic) {
      const point = line.match(/^(?:[-*]|\d+\.)\s+(.*)$/);
      if (point) topic.points.push(point[1]);
      else if (line.startsWith('→') && topic.notes.length > 0) topic.notes[topic.notes.length - 1] += ` ${line}`;
      else topic.notes.push(line);
    }
  }
  return sections;
}

function buildTopicMarkdown(t: OutlineTopic, sectionTitle: string): string {
  const parts = [`### 1. What This Topic Covers`, '', `Part of **${sectionTitle}**.`, ''];
  // Notes ending in ":" introduce the list ("Consider:", "Important packages:"); others stand alone.
  const intro = t.notes.filter((n) => n.endsWith(':'));
  const standalone = t.notes.filter((n) => !n.endsWith(':'));
  standalone.forEach((n) => parts.push(n, ''));
  intro.forEach((n) => parts.push(`**${n}**`, ''));
  t.points.forEach((p) => parts.push(`- ${p}`));
  return parts.join('\n').trim();
}

function plain(text: string): string {
  return text.replace(/`/g, '');
}

/** Turns an outline (see src/data/outlines/*.md) into seed sections and topics. */
export function buildCurriculumFromOutline(markdown: string, lastUpdated: string): { sections: Section[]; topics: Topic[] } {
  const outline = parseOutline(markdown);
  const sections: Section[] = [];
  const topics: Topic[] = [];
  const usedSlugs = new Set<string>();
  const sectionCounter: Record<string, number> = {};

  for (const sec of outline) {
    const prefix = SUBJECT_PREFIX[sec.subjectId];
    const order = (sectionCounter[sec.subjectId] = (sectionCounter[sec.subjectId] || 0) + 1);
    const nn = String(order).padStart(2, '0');
    const sectionId = `sec-${prefix.id}-${nn}`;
    const sectionTitle = `${nn}. ${sec.title}`;

    const topicIds: string[] = [];
    sec.topics.forEach((t, idx) => {
      let slug = `${prefix.slug}-${slugify(t.title)}`;
      if (usedSlugs.has(slug)) slug = `${slug}-${nn}`;
      usedSlugs.add(slug);

      const id = `top-${prefix.id}-${nn}-${idx + 1}-${slug.slice(prefix.slug.length + 1)}`;
      topicIds.push(id);

      const md = buildTopicMarkdown(t, sec.title);
      const pointsText = t.points.map(plain);
      const summary = pointsText.slice(0, 4).join(', ') + (pointsText.length > 4 ? ', and more' : '');

      topics.push({
        id,
        slug,
        subjectId: sec.subjectId,
        sectionId,
        title: plain(t.title),
        tags: [prefix.name, sec.title],
        quickDefinition: summary ? `${plain(t.title)}: ${summary}.` : plain(t.title),
        quickRevisionBulletPoints: pointsText,
        coreConceptMarkdown: md,
        articleSections: parseMarkdownToArticleSections(md),
        interviewQuestions: [],
        references: [],
        relatedTopicIds: [],
        lastUpdated,
        isPublished: true,
      });
    });

    sections.push({
      id: sectionId,
      slug: `${prefix.slug}-${nn}-${slugify(sec.title)}`,
      subjectId: sec.subjectId,
      title: sectionTitle,
      order,
      description: `Covers ${sec.topics.map((t) => plain(t.title)).join(', ')}.`,
      topicIds,
    });
  }

  return { sections, topics };
}
