import '../styles/TimelinesView.css';

function TimelinesView({ timelines, loading, onSelectTimeline, onRefresh }) {
  return (
    <div className="timelines-view">
      <div className="timelines-header">
        <h2>Your Timelines</h2>
        <button onClick={onRefresh} disabled={loading} className="btn-secondary">
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && <div className="loading-spinner">Loading timelines...</div>}

      {!loading && timelines.length === 0 && (
        <div className="empty-state">
          <p>No timelines yet. Create one to get started!</p>
        </div>
      )}

      {!loading && timelines.length > 0 && (
        <div className="timelines-grid">
          {timelines.map((timeline) => (
            <div
              key={timeline.id}
              className="timeline-card"
              onClick={() => onSelectTimeline(timeline)}
            >
              <div className="timeline-card-header">
                <h3>{timeline.value}</h3>
                <span className="timeline-id">ID: {timeline.id}</span>
              </div>
              <div className="timeline-card-body">
                <p className="timeline-description">
                  Click to view categories and items
                </p>
              </div>
              <div className="timeline-card-footer">
                <button className="btn-view" onClick={() => onSelectTimeline(timeline)}>
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TimelinesView;
