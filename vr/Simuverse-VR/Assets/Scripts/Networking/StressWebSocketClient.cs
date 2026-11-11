using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

/// <summary>
/// Polls GET http://localhost:8000/latest-stress at 5 Hz and forwards
/// fused_score to StressManager.Instance.UpdateStress().
///
/// Architecture:
///   Backend → StressWebSocketClient (HTTP polling) → StressManager → EnvironmentController
///
/// Attach to any persistent GameObject. No third-party packages required.
/// </summary>
public class StressWebSocketClient : MonoBehaviour
{
    [Header("Backend")]
    [Tooltip("URL of the latest-stress polling endpoint.")]
    public string endpointUrl = "http://localhost:8000/latest-stress";

    [Tooltip("Seconds between polls (0.2 = 5 Hz).")]
    public float pollInterval = 0.2f;

    private bool _running;

    // ── Unity lifecycle ────────────────────────────────────────────────────────

    private void Start()
    {
        _running = true;
        StartCoroutine(PollLoop());
    }

    private void OnDestroy()
    {
        _running = false;
    }

    private void OnApplicationQuit()
    {
        _running = false;
    }

    // ── Polling loop ───────────────────────────────────────────────────────────

    private IEnumerator PollLoop()
    {
        while (_running)
        {
            yield return StartCoroutine(Fetch());
            yield return new WaitForSeconds(pollInterval);
        }
    }

    private IEnumerator Fetch()
    {
        using (UnityWebRequest req = UnityWebRequest.Get(endpointUrl))
        {
            req.timeout = 2; // seconds — avoids blocking the loop on a stalled request

            yield return req.SendWebRequest();

            if (!_running) yield break;

            if (req.result != UnityWebRequest.Result.Success)
            {
                Debug.LogWarning($"[StressClient] Request failed: {req.error}");
                yield break;
            }

            string json = req.downloadHandler.text;

            StressMessage msg;
            try
            {
                msg = JsonUtility.FromJson<StressMessage>(json);
            }
            catch (System.Exception ex)
            {
                Debug.LogWarning($"[StressClient] JSON parse error: {ex.Message}");
                yield break;
            }

            if (msg == null)
            {
                Debug.LogWarning("[StressClient] Parsed message is null.");
                yield break;
            }

            Debug.Log($"[StressClient] fused={msg.fused_score:F3}  state={msg.stress_state}  conf={msg.confidence:F3}");

            if (StressManager.Instance != null)
            {
                StressManager.Instance.UpdateStress(msg.fused_score);
            }
            else
            {
                Debug.LogWarning("[StressClient] StressManager.Instance is null — skipped.");
            }
        }
    }
}