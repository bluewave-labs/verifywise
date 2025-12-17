import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Home,
  Flag,
  BarChart3,
  AlertTriangle,
  Building,
  FileText,
  Brain,
  Shield,
  GraduationCap,
  List as ListIcon,
  FolderTree,
  Layers,
  AlertCircle,
} from "lucide-react";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import useMultipleOnScreen from "../../../application/hooks/useMultipleOnScreen";
import { getAllTasks } from "../../../application/repository/task.repository";
import { TaskStatus } from "../../../domain/enums/task.enum";
import { useUserGuideSidebarContext } from "../UserGuide";
import SidebarShell, { SidebarMenuItem, SidebarMenuGroup } from "./SidebarShell";
import "./index.css";

interface SidebarProps {
  onOpenCreateDemoData?: () => void;
  onOpenDeleteDemoData?: () => void;
  hasDemoData?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  onOpenCreateDemoData,
  onOpenDeleteDemoData,
  hasDemoData = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { open: openUserGuide } = useUserGuideSidebarContext();
  const { changeComponentVisibility } = useContext(VerifyWiseContext);

  const { refs: _refs, allVisible } = useMultipleOnScreen<HTMLElement>({
    countToTrigger: 1,
  });

  const [openTasksCount, setOpenTasksCount] = useState(0);

  useEffect(() => {
    if (allVisible) {
      changeComponentVisibility("sidebar", true);
    }
  }, [allVisible]);

  // Fetch open tasks count
  useEffect(() => {
    const fetchOpenTasksCount = async () => {
      try {
        const response = await getAllTasks({
          status: [TaskStatus.OPEN],
        });
        setOpenTasksCount(response?.data?.tasks?.length || 0);
      } catch (error) {
        console.error("Error fetching open tasks count:", error);
        setOpenTasksCount(0);
      }
    };

    fetchOpenTasksCount();
    const interval = setInterval(fetchOpenTasksCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Top level items
  const topItems: SidebarMenuItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <Home size={16} strokeWidth={1.5} />,
      path: "/",
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: <Flag size={16} strokeWidth={1.5} />,
      path: "/tasks",
      count: openTasksCount,
    },
  ];

  // Menu groups
  const menuGroups: SidebarMenuGroup[] = [
    {
      name: "DISCOVERY",
      items: [
        {
          id: "use-cases",
          label: "Use Cases",
          icon: <FolderTree size={16} strokeWidth={1.5} />,
          path: "/overview",
          highlightPaths: ["/project-view"],
        },
        {
          id: "organizational-view",
          label: "Organizational View",
          icon: <Layers size={16} strokeWidth={1.5} />,
          path: "/framework",
        },
        {
          id: "vendors",
          label: "Vendors",
          icon: <Building size={16} strokeWidth={1.5} />,
          path: "/vendors",
        },
        {
          id: "model-inventory",
          label: "Model Inventory",
          icon: <ListIcon size={16} strokeWidth={1.5} />,
          path: "/model-inventory",
        },
      ],
    },
    {
      name: "ASSURANCE",
      items: [
        {
          id: "risk-management",
          label: "Risk Management",
          icon: <AlertTriangle size={16} strokeWidth={1.5} />,
          path: "/risk-management",
        },
        {
          id: "training-registry",
          label: "Training Registry",
          icon: <GraduationCap size={16} strokeWidth={1.5} />,
          path: "/training",
        },
        {
          id: "evidence",
          label: "Evidence",
          icon: <FileText size={16} strokeWidth={1.5} />,
          path: "/file-manager",
        },
        {
          id: "reporting",
          label: "Reporting",
          icon: <BarChart3 size={16} strokeWidth={1.5} />,
          path: "/reporting",
        },
        {
          id: "ai-trust-center",
          label: "AI Trust Center",
          icon: <Brain size={16} strokeWidth={1.5} />,
          path: "/ai-trust-center",
        },
      ],
    },
    {
      name: "GOVERNANCE",
      items: [
        {
          id: "policy-manager",
          label: "Policy Manager",
          icon: <Shield size={16} strokeWidth={1.5} />,
          path: "/policies",
        },
        {
          id: "incident-management",
          label: "Incident Management",
          icon: <AlertCircle size={16} strokeWidth={1.5} />,
          path: "/ai-incident-managements",
        },
      ],
    },
  ];

  // Check if item is active based on current path
  const isItemActive = (item: SidebarMenuItem): boolean => {
    if (item.path === "/" && location.pathname === "/") {
      return true;
    }
    if (item.path && item.path !== "/" && location.pathname === item.path) {
      return true;
    }
    if (item.path && location.pathname.startsWith(`${item.path}/`)) {
      return true;
    }
    if (item.highlightPaths?.some((p) => location.pathname.startsWith(p))) {
      return true;
    }
    // Special case for assessments
    if (location.pathname === "/all-assessments" && item.path === "/assessment") {
      return true;
    }
    return false;
  };

  // Handle item click - navigate to path
  const handleItemClick = (item: SidebarMenuItem) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <SidebarShell
      topItems={topItems}
      menuGroups={menuGroups}
      isItemActive={isItemActive}
      onItemClick={handleItemClick}
      hasDemoData={hasDemoData}
      onOpenCreateDemoData={onOpenCreateDemoData}
      onOpenDeleteDemoData={onOpenDeleteDemoData}
      showReadyToSubscribe={true}
      openUserGuide={openUserGuide}
      enableFlyingHearts={true}
    />
  );
};

export default Sidebar;
