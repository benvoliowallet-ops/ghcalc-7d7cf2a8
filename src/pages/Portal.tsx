import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PortalLoginForm } from '../components/portal/PortalLoginForm';
import { PortalProjectView } from '../components/portal/PortalProjectView';

export default function Portal() {
  const { projectId } = useParams<{ projectId: string }>();
  const [projectData, setProjectData] = useState<unknown>(null);

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--navy))' }}>
        <p className="text-sm" style={{ color: 'hsl(var(--white) / 0.4)' }}>Neplatný odkaz na portál.</p>
      </div>
    );
  }

  if (!projectData) {
    return (
      <PortalLoginForm
        projectId={projectId}
        onSuccess={(data) => setProjectData(data)}
      />
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <PortalProjectView projectData={projectData as any} />;
}
