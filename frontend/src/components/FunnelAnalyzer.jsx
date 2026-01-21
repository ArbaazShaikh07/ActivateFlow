import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import EditableCell from "@/components/EditableCell";
import FunnelChart from "@/components/FunnelChart";
import RecoveryModeling from "@/components/RecoveryModeling";
import ActionRecommendations from "@/components/ActionRecommendations";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const INITIAL_STAGES = [
  { stage_name: "Signup Completed", users: 10000, avg_time_hours: 0, target_sla_hours: 0 },
  { stage_name: "Email / Phone Verified", users: 7200, avg_time_hours: 8, target_sla_hours: 2 },
  { stage_name: "First Key Action Started", users: 5100, avg_time_hours: 24, target_sla_hours: 12 },
  { stage_name: "First Key Action Completed", users: 3400, avg_time_hours: 36, target_sla_hours: 24 },
  { stage_name: "Second Usage Within 7 Days", users: 2550, avg_time_hours: 120, target_sla_hours: 168 }
];

const FunnelAnalyzer = () => {
  const [revenuePerUser, setRevenuePerUser] = useState(450);
  const [stages, setStages] = useState(INITIAL_STAGES);
  const [calculations, setCalculations] = useState(null);
  const [worstStage, setWorstStage] = useState(null);

  const calculateMetrics = useCallback(() => {
    const results = [];
    let cumulativeDropoff = 0;

    for (let i = 0; i < stages.length; i++) {
      const current = stages[i];
      const next = stages[i + 1];

      if (next) {
        const conversionRate = (next.users / current.users) * 100;
        const dropoffRate = 100 - conversionRate;
        const usersLost = current.users - next.users;
        const isDelayed = current.avg_time_hours > current.target_sla_hours * 2;
        const isCriticalDropoff = dropoffRate > 30;

        cumulativeDropoff += usersLost;

        results.push({
          stageIndex: i,
          stageName: current.stage_name,
          users: current.users,
          nextStageUsers: next.users,
          conversionRate: conversionRate.toFixed(1),
          dropoffRate: dropoffRate.toFixed(1),
          usersLost,
          revenueAtRisk: (usersLost * revenuePerUser).toFixed(0),
          avgTime: current.avg_time_hours,
          targetSLA: current.target_sla_hours,
          isDelayed,
          isCriticalDropoff,
          impactScore: usersLost * (isCriticalDropoff ? 2 : 1) * (isDelayed ? 1.5 : 1)
        });
      }
    }

    const finalActivated = stages[stages.length - 1].users;
    const cumulativeActivationRate = ((finalActivated / stages[0].users) * 100).toFixed(1);

    const totalTimeToValue = stages.slice(0, -1).reduce((sum, stage) => sum + stage.avg_time_hours, 0);

    const worst = results.reduce((max, curr) => 
      curr.impactScore > max.impactScore ? curr : max
    , results[0]);

    setCalculations({
      stageResults: results,
      cumulativeActivationRate,
      totalTimeToValue: totalTimeToValue.toFixed(0),
      totalUsersLost: cumulativeDropoff,
      totalRevenueAtRisk: (cumulativeDropoff * revenuePerUser).toFixed(0)
    });

    setWorstStage(worst);
  }, [stages, revenuePerUser]);

  useEffect(() => {
    calculateMetrics();
  }, [calculateMetrics]);

  const handleCellEdit = (stageIndex, field, value) => {
    const newStages = [...stages];
    newStages[stageIndex][field] = parseFloat(value) || 0;
    setStages(newStages);
  };

  return (
    <div className="analyzer-container" data-testid="funnel-analyzer">
      <header className="analyzer-header">
        <div className="header-content">
          <h1 className="tool-title" data-testid="tool-title">ActivateFlow</h1>
          <p className="tool-subtitle">Live Activation Funnel Analyzer</p>
        </div>
        <div className="summary-metrics">
          <div className="metric-box">
            <span className="metric-label">Activation Rate</span>
            <span className="metric-value" data-testid="activation-rate">{calculations?.cumulativeActivationRate || 0}%</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Time to Value</span>
            <span className="metric-value" data-testid="time-to-value">{calculations?.totalTimeToValue || 0}h</span>
          </div>
          <div className="metric-box revenue">
            <span className="metric-label">Revenue at Risk</span>
            <span className="metric-value" data-testid="revenue-at-risk">${calculations?.totalRevenueAtRisk || 0}</span>
          </div>
        </div>
      </header>

      <div className="main-content">
        <section className="input-section">
          <div className="section-header">
            <h2>Funnel Configuration</h2>
            <div className="revenue-input-group">
              <label>Revenue per Activated User: $</label>
              <input
                type="number"
                value={revenuePerUser}
                onChange={(e) => setRevenuePerUser(parseFloat(e.target.value) || 0)}
                className="revenue-input"
                data-testid="revenue-input"
              />
            </div>
          </div>

          <div className="table-container">
            <table className="data-table" data-testid="funnel-table">
              <thead>
                <tr>
                  <th className="col-stage">Funnel Stage</th>
                  <th className="col-number">Users</th>
                  <th className="col-number">Avg Time (hrs)</th>
                  <th className="col-number">Target SLA (hrs)</th>
                  <th className="col-number">Conversion %</th>
                  <th className="col-number">Drop-off %</th>
                  <th className="col-number">Users Lost</th>
                  <th className="col-number">Revenue at Risk</th>
                  <th className="col-flag">Flags</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((stage, index) => {
                  const result = calculations?.stageResults.find(r => r.stageIndex === index);
                  const isLastStage = index === stages.length - 1;
                  const activationRate = isLastStage && calculations ? calculations.cumulativeActivationRate : null;
                  
                  return (
                    <tr key={index} className={worstStage?.stageIndex === index ? "worst-stage" : isLastStage ? "success-stage" : ""}>
                      <td className="stage-name" data-testid={`stage-name-${index}`}>{stage.stage_name}</td>
                      <td data-testid={`stage-users-${index}`}>
                        <EditableCell
                          value={stage.users}
                          onSave={(val) => handleCellEdit(index, "users", val)}
                        />
                      </td>
                      <td data-testid={`stage-avg-time-${index}`}>
                        <EditableCell
                          value={stage.avg_time_hours}
                          onSave={(val) => handleCellEdit(index, "avg_time_hours", val)}
                        />
                      </td>
                      <td data-testid={`stage-target-sla-${index}`}>
                        <EditableCell
                          value={stage.target_sla_hours}
                          onSave={(val) => handleCellEdit(index, "target_sla_hours", val)}
                        />
                      </td>
                      <td className="metric-cell" data-testid={`stage-conversion-${index}`}>
                        {isLastStage ? (
                          <span className="success-metric" title="Overall activation rate">{activationRate}%</span>
                        ) : (
                          result?.conversionRate || "—"
                        )}
                      </td>
                      <td className="metric-cell" data-testid={`stage-dropoff-${index}`}>
                        {isLastStage ? <span className="success-label">ACTIVATED</span> : (result?.dropoffRate || "—")}
                      </td>
                      <td className="metric-cell" data-testid={`stage-users-lost-${index}`}>
                        {isLastStage ? "—" : (result?.usersLost.toLocaleString() || "—")}
                      </td>
                      <td className="metric-cell revenue" data-testid={`stage-revenue-risk-${index}`}>
                        {isLastStage ? "—" : (result?.revenueAtRisk ? `$${parseInt(result.revenueAtRisk).toLocaleString()}` : "—")}
                      </td>
                      <td className="flag-cell">
                        {result?.isCriticalDropoff && <span className="flag flag-critical" data-testid={`flag-dropoff-${index}`}>Drop &gt;30%</span>}
                        {result?.isDelayed && <span className="flag flag-delay" data-testid={`flag-delay-${index}`}>2x SLA</span>}
                        {isLastStage && <span className="flag flag-success" data-testid="flag-success">Success</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="analyst-note">
            <strong>Analyst Note:</strong> Verification delay (Stage 2) may reflect email deliverability issues or low mobile engagement. First Key Action drop-off suggests potential UX friction or unclear value proposition during onboarding.
          </div>
        </section>

        <section className="visualization-section">
          <h2>Funnel Visualization</h2>
          <FunnelChart stages={stages} calculations={calculations} />
        </section>

        {worstStage && (
          <>
            <RecoveryModeling
              worstStage={worstStage}
              revenuePerUser={revenuePerUser}
              stages={stages}
            />

            <ActionRecommendations worstStage={worstStage} />
          </>
        )}
      </div>
    </div>
  );
};

export default FunnelAnalyzer;