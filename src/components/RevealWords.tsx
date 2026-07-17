import React from 'react';
import { useReveal } from '../hooks/useReveal';
import { tokens } from '../theme';

export interface Word {
  text: string;
  italic?: boolean;
  color?: string;
}

interface RevealWordsProps {
  words: Word[];
  style?: React.CSSProperties;
  wordStyle?: React.CSSProperties;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  stagger?: number;
}

export function RevealWords({
  words,
  style,
  wordStyle,
  as = 'h2',
  stagger = 70,
}: RevealWordsProps) {
  const { ref, visible } = useReveal<HTMLHeadingElement>(0.25);
  const Tag = as;

  return (
    <Tag
      ref={ref as React.Ref<HTMLHeadingElement>}
      style={{
        fontFamily: tokens.display,
        margin: 0,
        display: 'flex',
        flexWrap: 'wrap',
        ...style,
      }}
    >
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            paddingBottom: '0.12em',
            marginRight: '0.28em',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              fontStyle: word.italic ? 'italic' : 'normal',
              color: word.color ?? 'inherit',
              transform: visible ? 'translateY(0)' : 'translateY(110%)',
              opacity: visible ? 1 : 0,
              transition: `transform 0.9s cubic-bezier(0.22,1,0.36,1) ${i * stagger}ms, opacity 0.9s ease ${i * stagger}ms`,
              ...wordStyle,
            }}
          >
            {word.text}
          </span>
        </span>
      ))}
    </Tag>
  );
}
