import { useMemo } from 'react';
import { SearchResult, Topic, Subject, Section } from '../types';
import { storageService } from '../services/storageService';

export function useSearch(query: string): SearchResult[] {
  return useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return [];

    const store = storageService.getStore();
    const results: SearchResult[] = [];

    const subjectMap = new Map<string, Subject>(store.subjects.map((s) => [s.id, s]));
    const sectionMap = new Map<string, Section>(store.sections.map((s) => [s.id, s]));

    // 1. Search Subjects
    store.subjects.forEach((subj) => {
      if (
        subj.name.toLowerCase().includes(trimmed) ||
        subj.shortDescription.toLowerCase().includes(trimmed)
      ) {
        results.push({
          type: 'subject',
          id: subj.id,
          title: subj.name,
          breadcrumb: 'Subject',
          subjectId: subj.id,
          snippet: subj.shortDescription,
          tags: [subj.name],
          matchedField: subj.name.toLowerCase().includes(trimmed) ? 'Subject Name' : 'Description',
        });
      }
    });

    // 2. Search Topics
    store.topics.forEach((topic: Topic) => {
      const subject = subjectMap.get(topic.subjectId);
      const section = sectionMap.get(topic.sectionId);
      const breadcrumb = `${subject?.name || 'Subject'} → ${section?.title || 'Section'} → ${topic.title}`;

      // Title match (highest priority)
      if (topic.title.toLowerCase().includes(trimmed)) {
        results.push({
          type: 'topic',
          id: topic.id,
          title: topic.title,
          breadcrumb,
          subjectId: topic.subjectId,
          sectionId: topic.sectionId,
          topicId: topic.id,
          snippet: topic.quickDefinition,
          tags: topic.tags,
          matchedField: 'Topic Title',
        });
        return; // Don't duplicate for same topic
      }

      // Tag match
      const matchedTag = topic.tags.find((t) => t.toLowerCase().includes(trimmed));
      if (matchedTag) {
        results.push({
          type: 'tag',
          id: topic.id,
          title: topic.title,
          breadcrumb,
          subjectId: topic.subjectId,
          sectionId: topic.sectionId,
          topicId: topic.id,
          snippet: `Matched tag: #${matchedTag} • ${topic.quickDefinition}`,
          tags: topic.tags,
          matchedField: `Tag: #${matchedTag}`,
        });
        return;
      }

      // Quick definition match
      if (topic.quickDefinition.toLowerCase().includes(trimmed)) {
        results.push({
          type: 'topic',
          id: topic.id,
          title: topic.title,
          breadcrumb,
          subjectId: topic.subjectId,
          sectionId: topic.sectionId,
          topicId: topic.id,
          snippet: extractSnippet(topic.quickDefinition, trimmed),
          tags: topic.tags,
          matchedField: 'Quick Definition',
        });
        return;
      }

      // Quick revision bullets match
      const matchedBullet = topic.quickRevisionBulletPoints.find((b) =>
        b.toLowerCase().includes(trimmed)
      );
      if (matchedBullet) {
        results.push({
          type: 'topic',
          id: topic.id,
          title: topic.title,
          breadcrumb,
          subjectId: topic.subjectId,
          sectionId: topic.sectionId,
          topicId: topic.id,
          snippet: extractSnippet(matchedBullet, trimmed),
          tags: topic.tags,
          matchedField: 'Quick Revision',
        });
        return;
      }

      // Interview questions match
      const matchedQuestion = topic.interviewQuestions.find(
        (q) =>
          q.question.toLowerCase().includes(trimmed) ||
          q.shortAnswer.toLowerCase().includes(trimmed) ||
          q.detailedAnswer.toLowerCase().includes(trimmed)
      );
      if (matchedQuestion) {
        results.push({
          type: 'interview_question',
          id: `${topic.id}-${matchedQuestion.id}`,
          title: matchedQuestion.question,
          breadcrumb: `${breadcrumb} → Q&A`,
          subjectId: topic.subjectId,
          sectionId: topic.sectionId,
          topicId: topic.id,
          snippet: extractSnippet(matchedQuestion.shortAnswer, trimmed),
          tags: topic.tags,
          matchedField: 'Interview Question',
        });
        return;
      }

      // Core concept markdown match
      if (topic.coreConceptMarkdown.toLowerCase().includes(trimmed)) {
        results.push({
          type: 'topic',
          id: topic.id,
          title: topic.title,
          breadcrumb,
          subjectId: topic.subjectId,
          sectionId: topic.sectionId,
          topicId: topic.id,
          snippet: extractSnippet(topic.coreConceptMarkdown, trimmed),
          tags: topic.tags,
          matchedField: 'Notes & Deep Dive',
        });
        return;
      }

      // References match
      const matchedRef = topic.references.find(
        (r) =>
          r.title.toLowerCase().includes(trimmed) ||
          r.source.toLowerCase().includes(trimmed) ||
          (r.description && r.description.toLowerCase().includes(trimmed))
      );
      if (matchedRef) {
        results.push({
          type: 'reference',
          id: `${topic.id}-${matchedRef.id}`,
          title: matchedRef.title,
          breadcrumb: `${breadcrumb} → Reference`,
          subjectId: topic.subjectId,
          sectionId: topic.sectionId,
          topicId: topic.id,
          snippet: matchedRef.description || matchedRef.source,
          tags: topic.tags,
          matchedField: 'Reference Resource',
        });
      }
    });

    return results.slice(0, 20); // Cap at 20 most relevant
  }, [query]);
}

function extractSnippet(text: string, term: string, snippetLength: number = 140): string {
  const clean = text.replace(/[#*`_>]/g, ' ').replace(/\s+/g, ' ');
  const index = clean.toLowerCase().indexOf(term);
  if (index === -1) {
    return clean.slice(0, snippetLength) + (clean.length > snippetLength ? '...' : '');
  }

  const start = Math.max(0, index - 40);
  const end = Math.min(clean.length, index + term.length + 80);
  let snippet = clean.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < clean.length) snippet = snippet + '...';
  return snippet;
}
