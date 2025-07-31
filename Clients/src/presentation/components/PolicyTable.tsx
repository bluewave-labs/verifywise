import React from 'react';
import { Policy } from '../pages/PolicyDashboard/PoliciesDashboard';

interface Props {
  data: Policy[];
  onOpen: (id: string) => void;
  isLoading?: boolean;
  error?: Error | null;
}

const tableHeaders = [
  'Title', 'Status', 'Tags', 'Next Review',
  'Author', 'Reviewers', 'Last Updated', 'Updated By', 'Actions'
] as const;

const statusColors: Record<string, string> = {
  Draft: '#6c757d',
  'In review': '#fd7e14',
  Approved: '#28a745',
  Published: '#007bff',
  Archived: '#6c757d'
};

const PolicyTable: React.FC<Props> = ({ data, onOpen, isLoading, error }) => {
  const handleRowClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    onOpen(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(id);
    }
  };

  if (error) {
    return <div className="error-message">Error loading policies: {error.message}</div>;
  }

  if (isLoading) {
    return <div className="loading-indicator">Loading policies...</div>;
  }

  if (data.length === 0) {
    return <div className="empty-state">No policies found</div>;
  }

  return (
    <div className="table-container" style={{ overflowX: 'auto' }}>
      <table className="policy-table" aria-label="Policies">
        <thead>
          <tr>
            {tableHeaders.map(header => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(policy => (
            <tr 
              key={policy.id} 
              onClick={(e) => handleRowClick(e, policy.id)}
              onKeyDown={(e) => handleKeyDown(e, policy.id)}
              tabIndex={0}
              aria-label={`Policy: ${policy.title}`}
              className="policy-row"
            >
              <td>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(policy.id);
                  }}
                  className="text-link"
                  aria-label={`Edit ${policy.title}`}
                >
                  {policy.title}
                </button>
              </td>
              <td>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: statusColors[policy.status] || '#6c757d' }}
                >
                  {policy.status}
                </span>
              </td>
              <td>{policy.tags?.join(', ') || '-'}</td>
              <td>
                {policy.next_review_date
                  ? new Date(policy.next_review_date).toLocaleDateString()
                  : '-'}
              </td>
              <td>{policy.author_id ?? '-'}</td>
              <td>{policy.assigned_reviewer_ids?.join(', ') || '-'}</td>
              <td>
                {policy.last_updated_at
                  ? new Date(policy.last_updated_at).toLocaleString()
                  : '-'}
              </td>
              <td>{policy.last_updated_by ?? '-'}</td>
              <td>
                <button 
                  onClick={() => onOpen(policy.id)}
                  aria-label={`Edit policy ${policy.title}`}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PolicyTable;