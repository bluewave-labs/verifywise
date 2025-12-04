import React from 'react';

// Foundations - all standalone
import ColorsSection from './sections/ColorsSection';
import TypographySection from './sections/TypographySection';
import SpacingLayoutSection from './sections/SpacingLayoutSection';
import ShadowsSection from './sections/ShadowsSection';
import AnimationsSection from './sections/AnimationsSection';
import BreakpointsSection from './sections/BreakpointsSection';
import ZIndexSection from './sections/ZIndexSection';
import IconsSection from './sections/IconsSection';

// Resources - all standalone
import DosAndDontsSection from './sections/DosAndDontsSection';
import AccessibilitySection from './sections/AccessibilitySection';
import FileStructureSection from './sections/FileStructureSection';
import CommonPatternsSection from './sections/CommonPatternsSection';
import DocumentationGuidelinesSection from './sections/DocumentationGuidelinesSection';

// Components - all now standalone with mock components
import AlertsSection from './sections/AlertsSection';
import PaginationSection from './sections/PaginationSection';
import CardsSection from './sections/CardsSection';
import AvatarsSection from './sections/AvatarsSection';
import TablesSection from './sections/TablesSection';
import BreadcrumbsSection from './sections/BreadcrumbsSection';
import ButtonsSection from './sections/ButtonsSection';
import FormInputsSection from './sections/FormInputsSection';
import TogglesSection from './sections/TogglesSection';
import ModalsSection from './sections/ModalsSection';
import StatusSection from './sections/StatusSection';
import TagsSection from './sections/TagsSection';
import EmptyStatesSection from './sections/EmptyStatesSection';
import LoadingStatesSection from './sections/LoadingStatesSection';
import TooltipsSection from './sections/TooltipsSection';
import TabsSection from './sections/TabsSection';

interface StyleGuideWrapperProps {
  section: string;
}

const StyleGuideWrapper: React.FC<StyleGuideWrapperProps> = ({ section }) => {
  switch (section) {
    // Foundations
    case 'colors':
      return <ColorsSection />;
    case 'typography':
      return <TypographySection />;
    case 'spacing':
      return <SpacingLayoutSection />;
    case 'shadows':
      return <ShadowsSection />;
    case 'animations':
      return <AnimationsSection />;
    case 'breakpoints':
      return <BreakpointsSection />;
    case 'z-index':
      return <ZIndexSection />;
    case 'icons':
      return <IconsSection />;

    // Resources
    case 'dos-and-donts':
      return <DosAndDontsSection />;
    case 'accessibility':
      return <AccessibilitySection />;
    case 'file-structure':
      return <FileStructureSection />;
    case 'common-patterns':
      return <CommonPatternsSection />;
    case 'documentation-guidelines':
      return <DocumentationGuidelinesSection />;

    // Components
    case 'form-inputs':
      return <FormInputsSection />;
    case 'buttons':
      return <ButtonsSection />;
    case 'tables':
      return <TablesSection />;
    case 'cards':
      return <CardsSection />;
    case 'modals':
      return <ModalsSection />;
    case 'toggles':
      return <TogglesSection />;
    case 'status':
      return <StatusSection />;
    case 'alerts':
      return <AlertsSection />;
    case 'breadcrumbs':
      return <BreadcrumbsSection />;
    case 'pagination':
      return <PaginationSection />;
    case 'tags':
      return <TagsSection />;
    case 'empty-states':
      return <EmptyStatesSection />;
    case 'loading-states':
      return <LoadingStatesSection />;
    case 'tooltips':
      return <TooltipsSection />;
    case 'avatars':
      return <AvatarsSection />;
    case 'tabs':
      return <TabsSection />;

    default:
      return <ColorsSection />;
  }
};

export default StyleGuideWrapper;
