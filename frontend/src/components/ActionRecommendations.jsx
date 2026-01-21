const getRecommendation = (stageName) => {
  const recommendations = {
    "Signup Completed": {
      primary: {
        action: "Implement automated verification reminders with clear value messaging",
        owner: "Marketing",
        impact: "Expected to reduce verification time by 40% and recover 10-15% of drop-offs",
        effort: "Low"
      },
      deferred: {
        action: "SMS verification as alternative to email",
        constraint: "Requires vendor integration and compliance review (3-4 weeks)"
      }
    },
    "Email / Phone Verified": {
      primary: {
        action: "Add contextual tooltips and progress indicator during first key action",
        owner: "Product",
        impact: "Estimated 15-20% improvement in completion rate based on similar UX fixes",
        effort: "Medium"
      },
      deferred: {
        action: "Personalized action recommendations based on user role",
        constraint: "Depends on user segmentation model (not yet implemented)"
      }
    },
    "First Key Action Started": {
      primary: {
        action: "Deploy in-app guidance overlay with completion checklist",
        owner: "Product",
        impact: "Projected 18-25% boost in completion rates, reduces support tickets by ~30%",
        effort: "Medium"
      },
      deferred: {
        action: "AI-powered assistance during action completion",
        constraint: "High implementation effort, requires ML model training"
      }
    },
    "First Key Action Completed": {
      primary: {
        action: "Automated congratulations email + next-step CTA within 24 hours",
        owner: "Marketing",
        impact: "Expected to drive 20-30% return rate within 7 days (industry benchmark)",
        effort: "Low"
      },
      deferred: {
        action: "Build personalized dashboard showing account-specific insights",
        constraint: "Requires data pipeline enhancements and 2-3 sprint cycles"
      }
    },
    "Second Usage Within 7 Days": {
      primary: {
        action: "Implement retention email series with usage tips and success stories",
        owner: "Marketing",
        impact: "Could recover 12-18% of at-risk users based on cohort analysis",
        effort: "Low"
      },
      deferred: {
        action: "Proactive customer success outreach for high-value accounts",
        constraint: "Limited CS team capacity, can only handle top 20% of accounts"
      }
    }
  };

  return recommendations[stageName] || recommendations["Email / Phone Verified"];
};

const ActionRecommendations = ({ worstStage }) => {
  const recommendation = getRecommendation(worstStage.stageName);

  return (
    <section className="recommendations-section" data-testid="recommendations-section">
      <h2>Action Recommendations</h2>

      <div className="recommendation-card primary" data-testid="primary-recommendation">
        <div className="recommendation-header">
          <span className="recommendation-badge">RECOMMENDED</span>
          <span className="recommendation-owner">{recommendation.primary.owner}</span>
        </div>
        <div className="recommendation-action">{recommendation.primary.action}</div>
        <div className="recommendation-details">
          <div className="detail-item">
            <span className="detail-label">Expected Impact:</span>
            <span className="detail-value">{recommendation.primary.impact}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Effort Level:</span>
            <span className={`effort-badge effort-${recommendation.primary.effort.toLowerCase()}`}>{recommendation.primary.effort}</span>
          </div>
        </div>
      </div>

      <div className="recommendation-card deferred" data-testid="deferred-recommendation">
        <div className="recommendation-header">
          <span className="recommendation-badge deferred-badge">DEFERRED</span>
        </div>
        <div className="recommendation-action">{recommendation.deferred.action}</div>
        <div className="recommendation-constraint">
          <strong>Constraint:</strong> {recommendation.deferred.constraint}
        </div>
      </div>

      <div className="decision-summary" data-testid="decision-summary">
        <strong>Decision Summary:</strong> Address {worstStage.stageName} immediately. The recommended action provides the highest impact-to-effort ratio and can be deployed quickly. Revenue proxy estimates are for prioritization only—actual business impact depends on execution quality and user segment responsiveness.
      </div>
    </section>
  );
};

export default ActionRecommendations;