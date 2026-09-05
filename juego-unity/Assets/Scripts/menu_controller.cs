using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.UI;

public class menu_controller : MonoBehaviour
{
    public GameObject MenuCanva;
    private bool isPaused = false;

    [SerializeField] private Button resumeButton;

    void Start()
    {
        MenuCanva.SetActive(false);
        isPaused = false;
        Resume();
    }

    // Update is called once per frame
    void Update()
    {
        resumeButton.onClick.AddListener(Resume);

        if (Keyboard.current.escapeKey.wasPressedThisFrame)
        {
            if (isPaused) Resume();
            else Pause();

        }
    }

    void Pause()
    {
        MenuCanva.SetActive(true);
        Time.timeScale = 0f;
        isPaused = true;
        player_movement.isPaused = true;
    }

    void Resume()
    {
        MenuCanva.SetActive(false);
        Time.timeScale = 1f;
        isPaused = false;
        player_movement.isPaused = false;
    }
}
