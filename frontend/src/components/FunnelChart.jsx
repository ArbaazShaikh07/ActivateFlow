const FunnelChart = ({ stages, calculations }) => {
  if (!calculations || !calculations.stageResults) return null;

  const maxUsers = stages[0].users;

  return (
    <div className="funnel-chart" data-testid="funnel-chart">
      {stages.map((stage, index) => {
        const widthPercent = (stage.users / maxUsers) * 100;
        const result = calculations.stageResults.find(r => r.stageIndex === index);
        
        return (
          <div key={index} className="funnel-bar-container">
            <div className="funnel-bar-wrapper">
              <div
                className="funnel-bar"
                style={{ width: `${widthPercent}%` }}
                data-testid={`funnel-bar-${index}`}
              >
                <div className="funnel-bar-content">
                  <span className="bar-label">{stage.stage_name}</span>
                  <span className="bar-value">{stage.users.toLocaleString()}</span>
                </div>
              </div>
            </div>
            {result && (
              <div className="funnel-dropoff" data-testid={`funnel-dropoff-${index}`}>
                <span className="dropoff-arrow">↓</span>
                <span className="dropoff-text">{result.usersLost.toLocaleString()} lost ({result.dropoffRate}%)</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FunnelChart;