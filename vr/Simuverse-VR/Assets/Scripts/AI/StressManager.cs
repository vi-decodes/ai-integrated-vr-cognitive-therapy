using UnityEngine;

public class StressManager : MonoBehaviour
{
    public static StressManager Instance;

    [Header("Environment")]
    public EnvironmentController environmentController;

    [Header("Debug (Inspector)")]
    [Range(0f, 1f)]
    public float stressScore = 0.2f;

    private float previousScore = -1f;
    private StressState currentState = StressState.Calm;

    private void Awake()
    {
        if (Instance == null)
            Instance = this;
        else
            Destroy(gameObject);
    }

    private void Update()
    {
        // Detect changes from Inspector slider
        if (!Mathf.Approximately(previousScore, stressScore))
        {
            previousScore = stressScore;
            ApplyStress(stressScore);
        }
    }

    /// <summary>
    /// Called by the backend/WebSocket later.
    /// </summary>
    public void UpdateStress(float score)
    {
        stressScore = Mathf.Clamp01(score);
    }

    private void ApplyStress(float score)
    {
        StressState newState;

        if (score < 0.30f)
            newState = StressState.Calm;
        else if (score < 0.70f)
            newState = StressState.Mild;
        else
            newState = StressState.Escalated;

        if (newState == currentState)
            return;

        currentState = newState;

        if (environmentController != null)
            environmentController.ApplyStressState(currentState);

        Debug.Log($"Stress Score: {score:F2} | State: {currentState}");
    }
}