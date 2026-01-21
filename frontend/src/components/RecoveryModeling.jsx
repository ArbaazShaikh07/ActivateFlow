import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RECOVERY_ACTIONS = [
  { action_name: "Automated reminder emails with value messaging", expected_lift_percent: 12 },
  { action_name: "In-app contextual guidance + progress indicator", expected_lift_percent: 18 },
  { action_name: "Live onboarding support (chat/call) during key action", expected_lift_percent: 25 }
];

const RecoveryModeling = ({ worstStage, revenuePerUser, stages }) => {
  const [selectedAction, setSelectedAction] = useState(RECOVERY_ACTIONS[1]);
  const [liftPercent, setLiftPercent] = useState(selectedAction.expected_lift_percent);
  const [recoveryResults, setRecoveryResults] = useState(null);

  useEffect(() => {
    const calculateRecovery = async () => {
      try {
        const response = await axios.post(`${API}/recovery/calculate`, {
          stage_index: worstStage.stageIndex,
          action: {
            action_name: selectedAction.action_name,
            expected_lift_percent: liftPercent
          },
          current_users: worstStage.usersLost,
          revenue_per_activated_user: revenuePerUser
        });
        setRecoveryResults(response.data);
      } catch (error) {
        console.error("Recovery calculation error:", error);
      }
    };

    calculateRecovery();
  }, [worstStage, selectedAction, liftPercent, revenuePerUser]);

  const handleActionChange = (action) => {
    setSelectedAction(action);
    setLiftPercent(action.expected_lift_percent);
  };

  const newActivationRate = stages[stages.length - 1].users + (recoveryResults?.recovered_users || 0);
  const newActivationPercent = ((newActivationRate / stages[0].users) * 100).toFixed(1);

  return (
    <section className="recovery-section" data-testid="recovery-section">
      <div className="section-header">
        <h2>Recovery Modeling</h2>
        <div className="worst-stage-indicator" data-testid="worst-stage-indicator">
          <span className="indicator-label">Worst Stage:</span>
          <span className="indicator-value">{worstStage.stageName}</span>
          <span className="indicator-impact">({worstStage.usersLost.toLocaleString()} users lost, ${parseInt(worstStage.revenueAtRisk).toLocaleString()} at risk)</span>
        </div>
      </div>

      <div className="recovery-content">
        <div className="recovery-actions">
          <h3>Select Recovery Action</h3>
          {RECOVERY_ACTIONS.map((action, index) => (
            <div
              key={index}
              className={`action-option ${selectedAction.action_name === action.action_name ? "selected" : ""}`}
              onClick={() => handleActionChange(action)}
              data-testid={`recovery-action-${index}`}
            >
              <div className="action-name">{action.action_name}</div>
              <div className="action-lift">Expected Lift: {action.expected_lift_percent}%</div>
            </div>
          ))}
        </div>

        <div className="lift-adjustment">
          <label>Adjust Expected Lift (%)</label>
          <input
            type="number"
            value={liftPercent}
            onChange={(e) => setLiftPercent(parseFloat(e.target.value) || 0)}
            min="0"
            max="100"
            step="1"
            className="lift-input"
            data-testid="lift-input"
          />
          <div className="uncertainty-note">Note: Lift estimates based on similar B2B SaaS interventions. Actual results may vary by ±5-10% depending on implementation quality and user segment.</div>
        </div>

        {recoveryResults && (
          <div className="recovery-results" data-testid="recovery-results">
            <h3>Projected Impact</h3>
            <div className="results-grid">
              <div className="result-box">
                <span className="result-label">Recovered Users</span>
                <span className="result-value" data-testid="recovered-users">+{recoveryResults.recovered_users.toLocaleString()}</span>
              </div>
              <div className="result-box">
                <span className="result-label">New Activation Rate</span>
                <span className="result-value" data-testid="new-activation-rate">{newActivationPercent}%</span>
              </div>
              <div className="result-box revenue">
                <span className="result-label">Revenue Recovered</span>
                <span className="result-value" data-testid="revenue-recovered">${recoveryResults.revenue_recovered.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default RecoveryModeling;