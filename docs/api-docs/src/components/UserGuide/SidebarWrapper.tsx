import React, { useState, useEffect, useCallback } from 'react';
import { colors, border } from '../../styles/theme';
import TabBar from './TabBar';
import SidebarHeader from './SidebarHeader';
import UserGuideLanding from './UserGuideLanding';
import CollectionPage from './CollectionPage';
import ArticlePage from './ArticlePage';
import ContentRenderer from './ContentRenderer';
import HelpSection from './HelpSection';
import { getCollection, getArticle } from '@user-guide-content/userGuideConfig';
import { getArticleContent } from '@user-guide-content/content';
import { extractToc } from '@user-guide-content/contentTypes';
import './SidebarWrapper.css';

type Tab = 'user-guide' | 'help';

interface SidebarWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  initialPath?: string; // e.g., "getting-started/quick-start"
  onOpenInNewTab?: () => void;
}

const STORAGE_KEY = 'verifywise-sidebar-state';

const SidebarWrapper: React.FC<SidebarWrapperProps> = ({
  isOpen,
  onClose,
  initialPath,
  onOpenInNewTab,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('user-guide');
  const [collectionId, setCollectionId] = useState<string | undefined>();
  const [articleId, setArticleId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Parse initial path on mount
  useEffect(() => {
    if (initialPath) {
      const parts = initialPath.split('/');
      if (parts.length >= 1 && parts[0]) {
        setCollectionId(parts[0]);
        if (parts.length >= 2 && parts[1]) {
          setArticleId(parts[1]);
        }
      }
    }
  }, [initialPath]);

  // Persist sidebar state to localStorage
  useEffect(() => {
    if (isOpen) {
      const state = { activeTab, collectionId, articleId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [isOpen, activeTab, collectionId, articleId]);

  // Restore state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState && !initialPath) {
      try {
        const { activeTab: savedTab, collectionId: savedCollection, articleId: savedArticle } = JSON.parse(savedState);
        if (savedTab) setActiveTab(savedTab);
        if (savedCollection) setCollectionId(savedCollection);
        if (savedArticle) setArticleId(savedArticle);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [initialPath]);

  // Navigation handlers
  const handleNavigate = useCallback((newCollectionId: string, newArticleId?: string) => {
    setCollectionId(newCollectionId);
    setArticleId(newArticleId);
  }, []);

  const handleBackToHome = useCallback(() => {
    setCollectionId(undefined);
    setArticleId(undefined);
  }, []);

  const handleBackToCollection = useCallback(() => {
    setArticleId(undefined);
  }, []);

  const handleHomeClick = useCallback(() => {
    setCollectionId(undefined);
    setArticleId(undefined);
  }, []);

  // Get current collection and article
  const collection = collectionId ? getCollection(collectionId) : undefined;
  const article = collectionId && articleId ? getArticle(collectionId, articleId) : undefined;

  // Get prev/next articles for navigation
  const getAdjacentArticles = () => {
    if (!collection || !articleId) return { prev: undefined, next: undefined };
    const currentIndex = collection.articles.findIndex((a) => a.id === articleId);
    return {
      prev: currentIndex > 0 ? collection.articles[currentIndex - 1] : undefined,
      next: currentIndex < collection.articles.length - 1 ? collection.articles[currentIndex + 1] : undefined,
    };
  };

  const { prev: prevArticle, next: nextArticle } = getAdjacentArticles();

  // Get article content
  const articleContent = collectionId && articleId
    ? getArticleContent(collectionId, articleId)
    : undefined;

  // Auto-generate TOC from content headings
  const tocItems = articleContent ? extractToc(articleContent.blocks) : undefined;

  // Build breadcrumb items for dropdown
  const buildBreadcrumbs = () => {
    const items: { label: string; onClick: () => void }[] = [
      { label: 'User guide', onClick: handleHomeClick },
    ];
    if (collection) {
      items.push({ label: collection.title, onClick: () => setArticleId(undefined) });
    }
    if (article) {
      items.push({ label: article.title, onClick: () => {} });
    }
    return items;
  };

  // Handle "Open in new tab"
  const handleOpenInNewTab = () => {
    let path = '/resources/user-guide';
    if (collectionId) {
      path += `/${collectionId}`;
      if (articleId) {
        path += `/${articleId}`;
      }
    }
    if (onOpenInNewTab) {
      onOpenInNewTab();
    } else {
      window.open(path, '_blank');
    }
  };

  // Render User Guide content
  const renderUserGuideContent = () => {
    if (collection && article) {
      return (
        <ArticlePage
          collection={collection}
          article={article}
          onBack={handleBackToCollection}
          onBackToHome={handleBackToHome}
          prevArticle={prevArticle}
          nextArticle={nextArticle}
          onPrevArticle={prevArticle ? () => handleNavigate(collectionId!, prevArticle.id) : undefined}
          onNextArticle={nextArticle ? () => handleNavigate(collectionId!, nextArticle.id) : undefined}
          tocItems={tocItems}
          mode="in-app"
        >
          {articleContent && <ContentRenderer content={articleContent} onNavigate={handleNavigate} />}
        </ArticlePage>
      );
    }

    if (collection) {
      return (
        <CollectionPage
          collection={collection}
          onBack={handleBackToHome}
          onArticleClick={(id) => handleNavigate(collectionId!, id)}
        />
      );
    }

    return (
      <UserGuideLanding
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
    );
  };

  return (
    <div
      className={`sidebar-container ${isOpen ? 'open' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        display: 'flex',
        zIndex: 1000,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 300ms ease-in-out',
      }}
    >
      {/* Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Sidebar Content */}
      <div
        style={{
          width: 360,
          height: '100%',
          backgroundColor: colors.background.white,
          borderLeft: border.default,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <SidebarHeader
          breadcrumbs={buildBreadcrumbs()}
          onHomeClick={handleHomeClick}
          onClose={onClose}
          onOpenInNewTab={handleOpenInNewTab}
          isSearchOpen={isSearchOpen}
          onSearchToggle={() => setIsSearchOpen(!isSearchOpen)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Content Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: colors.background.alt,
          }}
        >
          {activeTab === 'user-guide' ? renderUserGuideContent() : <HelpSection />}
        </div>
      </div>
    </div>
  );
};

export default SidebarWrapper;
