using UnityEngine;

public enum StressState
{
    Calm,
    Mild,
    Escalated
}

public class EnvironmentController : MonoBehaviour
{
    [Header("Audience")]
    public GameObject frontRows;
    public GameObject middleRows;
    public GameObject backRows;

    [Header("Lighting")]
    public Light directionalLight;

    [Header("Light Intensities")]
    public float calmIntensity = 1.0f;
    public float mildIntensity = 0.8f;
    public float elevatedIntensity = 0.6f;

    public void ApplyStressState(StressState state)
    {
        switch (state)
        {
            case StressState.Calm:
                frontRows.SetActive(true);
                middleRows.SetActive(true);
                backRows.SetActive(true);

                if (directionalLight != null)
                    directionalLight.intensity = calmIntensity;
                break;

            case StressState.Mild:
                frontRows.SetActive(true);
                middleRows.SetActive(true);
                backRows.SetActive(false);

                if (directionalLight != null)
                    directionalLight.intensity = mildIntensity;
                break;

            case StressState.Escalated:
                frontRows.SetActive(true);
                middleRows.SetActive(false);
                backRows.SetActive(false);

                if (directionalLight != null)
                    directionalLight.intensity = elevatedIntensity;
                break;
        }

        Debug.Log($"[Environment] Applied Stress State: {state}");
    }

    // ---------- Temporary Testing Methods ----------
    // These can be called from the Inspector during Play Mode.

    [ContextMenu("Test Calm")]
    public void TestCalm()
    {
        ApplyStressState(StressState.Calm);
    }

    [ContextMenu("Test Mild")]
    public void TestMild()
    {
        ApplyStressState(StressState.Mild);
    }

    [ContextMenu("Test Elevated")]
    public void TestElevated()
    {
        ApplyStressState(StressState.Escalated);
    }
}