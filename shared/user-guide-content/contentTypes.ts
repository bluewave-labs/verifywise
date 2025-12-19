// Content block types for the templatic article system
export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | CalloutBlock
  | BulletListBlock
  | OrderedListBlock
  | ChecklistBlock
  | IconCardsBlock
  | GridCardsBlock
  | TimeEstimateBlock
  | InfoBoxBlock
  | CodeBlock
  | RequirementsBlock
  | TableBlock
  | ImageBlock
  | ArticleLinksBlock;

export interface HeadingBlock {
  type: 'heading';
  id: string; // Used for TOC anchors
  level: 2 | 3; // h2 or h3
  text: string;
}

export interface ParagraphBlock {
  type: 'paragraph';
  text: string; // Supports basic markdown: **bold**, *italic*, `code`
}

export interface CalloutBlock {
  type: 'callout';
  variant?: 'info' | 'tip' | 'warning' | 'success';
  title?: string;
  text: string;
}

export interface BulletListBlock {
  type: 'bullet-list';
  items: ListItem[];
}

export interface OrderedListBlock {
  type: 'ordered-list';
  items: ListItem[];
}

export interface ListItem {
  text: string;
  bold?: string; // Optional bold prefix
}

export interface ChecklistBlock {
  type: 'checklist';
  items: string[];
}

export interface IconCardItem {
  icon: string; // Icon name from lucide-react
  title: string;
  description: string;
}

export interface IconCardsBlock {
  type: 'icon-cards';
  items: IconCardItem[];
}

export interface GridCardItem {
  title: string;
  description: string;
  icon?: string;
}

export interface GridCardsBlock {
  type: 'grid-cards';
  items: GridCardItem[];
  columns?: number;
}

export interface TimeEstimateBlock {
  type: 'time-estimate';
  text: string;
}

export interface InfoBoxBlock {
  type: 'info-box';
  icon?: string;
  title: string;
  items: string[];
}

export interface CodeBlock {
  type: 'code';
  code: string;
  language?: string;
}

export interface RequirementItem {
  icon: string;
  title: string;
  items: string[];
}

export interface RequirementsBlock {
  type: 'requirements';
  items: RequirementItem[];
}

export interface TableRow {
  [key: string]: string;
}

export interface TableBlock {
  type: 'table';
  columns: { key: string; label: string; width?: string }[];
  rows: TableRow[];
}

export interface ImageBlock {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
}

// Article interlinks for "Next steps" sections
export interface ArticleLink {
  collectionId: string;
  articleId: string;
  title: string;
  description?: string;
}

export interface ArticleLinksBlock {
  type: 'article-links';
  title?: string; // e.g., "Next steps", "Related articles"
  items: ArticleLink[];
}

// Article content structure
export interface ArticleContent {
  blocks: ContentBlock[];
}

// TOC item - auto-generated from heading blocks
export interface TocItem {
  label: string;
  href: string;
  level: number;
}

// Helper to extract TOC from content blocks
export const extractToc = (blocks: ContentBlock[]): TocItem[] => {
  return blocks
    .filter((block): block is HeadingBlock => block.type === 'heading')
    .map((block) => ({
      label: block.text,
      href: `#${block.id}`,
      level: block.level,
    }));
};
