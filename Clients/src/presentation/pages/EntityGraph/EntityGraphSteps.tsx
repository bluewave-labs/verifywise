import { MousePointerClick, SquareMousePointer, Route, Sparkles, Search } from "lucide-react";
import { IPageTourStep } from "../../../domain/interfaces/i.tour";

const EntityGraphSteps: IPageTourStep[] = [
  {
    target: '[data-joyride-id="entity-graph-canvas"]',
    content: {
      header: "Entity relationship graph",
      body: "This interactive graph shows how your use cases, models, vendors, risks, controls, and evidence are connected. Click and drag to explore.",
      icon: <Sparkles size={20} color="#ffffff" />,
    },
    placement: "center",
  },
  {
    target: '[data-joyride-id="entity-search"]',
    content: {
      header: "Search entities",
      body: "Quickly find any entity by name. Matching nodes will be highlighted on the graph.",
      icon: <Search size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
  {
    target: '.react-flow__nodes',
    content: {
      header: "Click for details",
      body: "Click any node to view its details in a sidebar. Right-click for options like 'Show connections' or 'Show impact'.",
      icon: <MousePointerClick size={20} color="#ffffff" />,
    },
    placement: "right",
  },
  {
    target: '[data-joyride-id="gap-detection"]',
    content: {
      header: "Gap detection",
      body: "Identify compliance gaps across your entities. Missing risk assessments, controls, or evidence are highlighted with badges.",
      icon: <SquareMousePointer size={20} color="#ffffff" />,
    },
    placement: "left",
  },
  {
    target: '[data-joyride-id="impact-analysis"]',
    content: {
      header: "Impact analysis",
      body: "Select an entity to see its upstream and downstream connections. Use What-if mode to simulate removing an entity.",
      icon: <Route size={20} color="#ffffff" />,
    },
    placement: "left",
  },
];

export default EntityGraphSteps;
