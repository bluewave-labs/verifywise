
import PlateEditor from "./PlateEditor";

export interface FormData {
  title: string;
  status: string;
  tags: string[];
  nextReviewDate?: string;
  assignedReviewers: string[];
  content: any;
}

interface Props {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  tags: string[];
}

const statuses: FormData['status'][] = ['Draft', 'In review', 'Approved', 'Published', 'Archived'];

const PolicyForm: React.FC<Props> = ({ formData, setFormData, tags }) => (
  <div>
    {/* Title */}
    <label>
      Title
      <input
        type="text"
        value={formData.title}
        onChange={e => setFormData({ ...formData, title: e.target.value })}
      />
    </label>

    {/* Status */}
    <label>
      Status
      <select
        value={formData.status}
        onChange={e => setFormData({ ...formData, status: e.target.value as FormData['status'] })}
      >
        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </label>

    {/* Tags */}
    <label>
      Tags
      <select
        multiple
        value={formData.tags}
        onChange={e => {
          const opts = Array.from(e.target.selectedOptions, o => o.value);
          setFormData({ ...formData, tags: opts });
        }}
      >
        {tags.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </label>

    {/* Next Review Date */}
    <label>
      Next Review
      <input
        type="date"
        value={formData.nextReviewDate}
        onChange={e => setFormData({ ...formData, nextReviewDate: e.target.value })}
      />
    </label>

    {/* Assigned Reviewers */}
    <label>
      Assigned Reviewers
      <input
        type="text"
        value={formData.assignedReviewers.join(', ')}
        onChange={e => {
          const list = e.target.value.split(',').map(s => s.trim());
          setFormData({ ...formData, assignedReviewers: list });
        }}
        placeholder="comma-separated usernames"
      />
    </label>

    {/* Content Editor */}
    <label>Content</label>
    {/* <PlateEditor
      htmlValue={formData.content}
      onSlateChange={(value: any) => setFormData({ ...formData, content: value })}
    /> */}
  </div>
);

export default PolicyForm;
