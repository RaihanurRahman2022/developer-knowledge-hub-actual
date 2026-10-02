import { Subject, Section, Topic } from '../types';
import { initialDotnetHistorySections, initialDotnetHistoryTopics } from './dotnetHistoryData';
import { curriculumSections, curriculumTopics } from './dotnetCurriculumData';
import { efSections, efTopics } from './efCurriculumData';
import { sqlSections, sqlTopics } from './sqlCurriculumData';
import { buildCurriculumFromOutline } from './outlineCurriculum';
import goMongoOutline from './outlines/goMongoOutline.md?raw';

const goMongo = buildCurriculumFromOutline(goMongoOutline, '2026-10-02');

export const initialSubjects: Subject[] = [
  {
    id: 'subj-dotnet',
    slug: 'dotnet',
    name: '.NET',
    shortDescription: 'Modern Microsoft development platform, runtime internals, C# language, and ASP.NET Core.',
    icon: 'Layers',
    color: 'from-blue-600 to-indigo-700',
    lastUpdated: '2026-10-01',
    isPinned: true,
    order: 1,
  },
  {
    id: 'subj-efcore',
    slug: 'entity-framework',
    name: 'Entity Framework',
    shortDescription: 'Object-Relational Mapping (ORM), DbContext, Change Tracking, Query Performance, and Migrations.',
    icon: 'Database',
    color: 'from-purple-600 to-indigo-600',
    lastUpdated: '2026-10-01',
    isPinned: true,
    order: 2,
  },
  {
    id: 'subj-sql',
    slug: 'sql',
    name: 'SQL',
    shortDescription: 'Relational database architecture, B-Tree indexes, MVCC, transaction isolation levels, and EXPLAIN plans.',
    icon: 'Database',
    color: 'from-emerald-600 to-teal-700',
    lastUpdated: '2026-10-01',
    isPinned: true,
    order: 3,
  },
  {
    id: 'subj-go',
    slug: 'go',
    name: 'GO',
    shortDescription: 'Concurrent systems programming, goroutines, GMP scheduler, memory management, and network services.',
    icon: 'Zap',
    color: 'from-cyan-600 to-blue-600',
    lastUpdated: '2026-10-01',
    isPinned: false,
    order: 4,
  },
  {
    id: 'subj-nosql',
    slug: 'nosql',
    name: 'NoSQL',
    shortDescription: 'Document, Key-Value, Columnar and Graph databases: MongoDB, Redis caching, CAP Theorem, and DynamoDB.',
    icon: 'Boxes',
    color: 'from-amber-600 to-orange-700',
    lastUpdated: '2026-10-01',
    isPinned: false,
    order: 5,
  },
  {
    id: 'subj-azure',
    slug: 'azure',
    name: 'Azure',
    shortDescription: 'Microsoft Cloud: App Services, Azure Functions, Cosmos DB, Blob Storage, Managed Identities, and Service Bus.',
    icon: 'Cloud',
    color: 'from-sky-600 to-blue-700',
    lastUpdated: '2026-10-01',
    isPinned: false,
    order: 6,
  },
  {
    id: 'subj-go',
    slug: 'go',
    name: 'Go',
    shortDescription: 'Concurrent systems programming, goroutines, GMP scheduler, memory management, and network services.',
    icon: 'Zap',
    color: 'from-cyan-600 to-blue-600',
    lastUpdated: '2026-10-02',
    isPinned: true,
    order: 4,
  },
  {
    id: 'subj-nosql',
    slug: 'nosql',
    name: 'NoSQL',
    shortDescription: 'Document databases with MongoDB: modeling, CRUD, indexes, aggregation, transactions, replication, sharding, and Go integration.',
    icon: 'Boxes',
    color: 'from-amber-600 to-orange-700',
    lastUpdated: '2026-10-02',
    isPinned: false,
    order: 5,
  },
  {
    id: 'subj-aws',
    slug: 'aws',
    name: 'AWS',
    shortDescription: 'Amazon Web Services: EC2, S3, Lambda, DynamoDB, ECS/EKS, VPC, IAM, and EventBridge architecture.',
    icon: 'Server',
    color: 'from-amber-500 to-yellow-600',
    lastUpdated: '2026-10-01',
    isPinned: false,
    order: 7,
  },
];

export const initialSections: Section[] = [
  ...initialDotnetHistorySections,
  ...curriculumSections,
  ...efSections,
  ...sqlSections,
  ...goMongo.sections,
];

export const initialTopics: Topic[] = [
  ...initialDotnetHistoryTopics,
  ...curriculumTopics,
  ...efTopics,
  ...sqlTopics,
  ...goMongo.topics,
];

export const initialProgress: Record<string, { status: any; isFavorite: boolean; revisionCount: number }> = {};

export const initialRecentlyVisited: string[] = [];
