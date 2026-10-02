import React from 'react';
import {
  SiDotnet,
  SiGo,
  SiPostgresql,
  SiMongodb,
  SiDocker,
  SiKubernetes,
  SiPython,
  SiTypescript,
} from 'react-icons/si';
import { VscAzure } from 'react-icons/vsc';
import { FaAws, FaLayerGroup } from 'react-icons/fa6';
import { TbSchema, TbNetwork } from 'react-icons/tb';

interface SubjectIconProps {
  name: string;
  className?: string;
  variant?: 'glyph' | 'badge';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

interface SubjectMeta {
  color: string;
  bgLight: string;
  bgDark: string;
  borderColor: string;
  IconComponent: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
}

export const getSubjectMeta = (name: string): SubjectMeta => {
  const normalized = (name || '').toLowerCase().trim();

  // 1. .NET / C#
  if (normalized.includes('.net') || normalized === 'c#' || normalized.includes('csharp')) {
    return {
      color: '#512BD4',
      bgLight: 'rgba(81, 43, 212, 0.08)',
      bgDark: 'rgba(81, 43, 212, 0.18)',
      borderColor: 'rgba(81, 43, 212, 0.25)',
      IconComponent: SiDotnet,
      label: '.NET',
    };
  }

  // 2. Entity Framework
  if (normalized.includes('entity') || normalized.includes('ef') || normalized.includes('orm')) {
    return {
      color: '#68217A',
      bgLight: 'rgba(104, 33, 122, 0.08)',
      bgDark: 'rgba(104, 33, 122, 0.18)',
      borderColor: 'rgba(104, 33, 122, 0.25)',
      IconComponent: TbSchema,
      label: 'Entity Framework',
    };
  }

  // 3. Go / Golang
  if (normalized === 'go' || normalized.includes('golang')) {
    return {
      color: '#00ADD8',
      bgLight: 'rgba(0, 173, 216, 0.08)',
      bgDark: 'rgba(0, 173, 216, 0.18)',
      borderColor: 'rgba(0, 173, 216, 0.25)',
      IconComponent: SiGo,
      label: 'Go',
    };
  }

  // 4. NoSQL / MongoDB / Redis / Document
  if (
    normalized.includes('nosql') ||
    normalized.includes('mongo') ||
    normalized.includes('redis') ||
    normalized.includes('dynamo') ||
    normalized.includes('document')
  ) {
    return {
      color: '#13AA52',
      bgLight: 'rgba(19, 170, 82, 0.08)',
      bgDark: 'rgba(19, 170, 82, 0.18)',
      borderColor: 'rgba(19, 170, 82, 0.25)',
      IconComponent: SiMongodb,
      label: 'NoSQL',
    };
  }

  // 5. SQL / PostgreSQL / MySQL
  if (
    !normalized.includes('nosql') &&
    (normalized.includes('sql') ||
      normalized.includes('postgres') ||
      normalized.includes('relational') ||
      normalized.includes('database'))
  ) {
    return {
      color: '#336791',
      bgLight: 'rgba(51, 103, 145, 0.08)',
      bgDark: 'rgba(51, 103, 145, 0.18)',
      borderColor: 'rgba(51, 103, 145, 0.25)',
      IconComponent: SiPostgresql,
      label: 'SQL / PostgreSQL',
    };
  }

  // 6. Microsoft Azure
  if (normalized.includes('azure')) {
    return {
      color: '#0078D4',
      bgLight: 'rgba(0, 120, 212, 0.08)',
      bgDark: 'rgba(0, 120, 212, 0.18)',
      borderColor: 'rgba(0, 120, 212, 0.25)',
      IconComponent: VscAzure,
      label: 'Azure',
    };
  }

  // 7. Amazon Web Services (AWS)
  if (normalized.includes('aws') || normalized.includes('amazon')) {
    return {
      color: '#FF9900',
      bgLight: 'rgba(255, 153, 0, 0.08)',
      bgDark: 'rgba(255, 153, 0, 0.18)',
      borderColor: 'rgba(255, 153, 0, 0.25)',
      IconComponent: FaAws,
      label: 'AWS',
    };
  }

  // 8. Docker
  if (normalized.includes('docker')) {
    return {
      color: '#2496ED',
      bgLight: 'rgba(36, 150, 237, 0.08)',
      bgDark: 'rgba(36, 150, 237, 0.18)',
      borderColor: 'rgba(36, 150, 237, 0.25)',
      IconComponent: SiDocker,
      label: 'Docker',
    };
  }

  // 9. Kubernetes
  if (normalized.includes('kubernetes') || normalized.includes('k8s')) {
    return {
      color: '#326CE5',
      bgLight: 'rgba(50, 108, 229, 0.08)',
      bgDark: 'rgba(50, 108, 229, 0.18)',
      borderColor: 'rgba(50, 108, 229, 0.25)',
      IconComponent: SiKubernetes,
      label: 'Kubernetes',
    };
  }

  // 10. System Design / Distributed Systems
  if (
    normalized.includes('system') ||
    normalized.includes('design') ||
    normalized.includes('distributed') ||
    normalized.includes('architecture') ||
    normalized.includes('microservice')
  ) {
    return {
      color: '#6366F1',
      bgLight: 'rgba(99, 102, 241, 0.08)',
      bgDark: 'rgba(99, 102, 241, 0.18)',
      borderColor: 'rgba(99, 102, 241, 0.25)',
      IconComponent: TbNetwork,
      label: 'System Design',
    };
  }

  // 11. Python
  if (normalized.includes('python')) {
    return {
      color: '#3776AB',
      bgLight: 'rgba(55, 118, 171, 0.08)',
      bgDark: 'rgba(55, 118, 171, 0.18)',
      borderColor: 'rgba(55, 118, 171, 0.25)',
      IconComponent: SiPython,
      label: 'Python',
    };
  }

  // 12. TypeScript / JavaScript
  if (normalized.includes('typescript') || normalized.includes('javascript') || normalized === 'ts' || normalized === 'js') {
    return {
      color: '#3178C6',
      bgLight: 'rgba(49, 120, 198, 0.08)',
      bgDark: 'rgba(49, 120, 198, 0.18)',
      borderColor: 'rgba(49, 120, 198, 0.25)',
      IconComponent: SiTypescript,
      label: 'TypeScript',
    };
  }

  // Default fallback
  return {
    color: '#6366F1',
    bgLight: 'rgba(99, 102, 241, 0.08)',
    bgDark: 'rgba(99, 102, 241, 0.18)',
    borderColor: 'rgba(99, 102, 241, 0.25)',
    IconComponent: FaLayerGroup,
    label: name,
  };
};

export const SubjectIcon: React.FC<SubjectIconProps> = ({
  name,
  className = 'w-5 h-5',
  variant = 'glyph',
  size = 'md',
}) => {
  const meta = getSubjectMeta(name);
  const IconComponent = meta.IconComponent;

  if (variant === 'badge') {
    const sizeClasses = {
      xs: 'w-7 h-7 rounded-md p-1.5',
      sm: 'w-8 h-8 rounded-lg p-1.5',
      md: 'w-10 h-10 rounded-xl p-2',
      lg: 'w-12 h-12 rounded-xl p-2.5',
      xl: 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-3',
    }[size];

    const iconSizes = {
      xs: 'w-3.5 h-3.5',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8 sm:w-9 sm:h-9',
    }[size];

    return (
      <div
        className={`${sizeClasses} shrink-0 flex items-center justify-center border transition-all`}
        style={{
          backgroundColor: meta.bgLight,
          borderColor: meta.borderColor,
        }}
        title={meta.label}
      >
        <IconComponent
          className={`${iconSizes} shrink-0 transition-transform group-hover:scale-105`}
          style={{ color: meta.color }}
        />
      </div>
    );
  }

  // Default clean glyph
  return (
    <IconComponent
      className={`${className} shrink-0`}
      style={{ color: meta.color }}
    />
  );
};
