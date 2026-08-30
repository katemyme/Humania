using UnityEngine;
using UnityEngine.InputSystem;

public class player_movement : MonoBehaviour
{
    private float moveSpeed = 5f;
    private Rigidbody2D rb;
    private Vector2 moveInput;
    private Animator animator;
    public static bool isPaused = false;
    private bool wasPaused = false;


    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
        animator = GetComponent<Animator>();
    }


    void Update()
    {
        if (isPaused)
        {
            rb.linearVelocity = Vector2.zero;
            animator.SetBool("isWalking", false);
            animator.SetFloat("LastInputX", moveInput.x);
            animator.SetFloat("LastInputY", moveInput.y);
            wasPaused = true;
            return;
        }

        if (wasPaused)
        {
            moveInput = Vector2.zero;
            animator.SetFloat("InputX", 0f);
            animator.SetFloat("InputY", 0f);
            wasPaused = false;
        }

        rb.linearVelocity = moveInput * moveSpeed;
    }

    public void Move(InputAction.CallbackContext context)
    {
        if (isPaused) return;

        animator.SetBool("isWalking", true);

        if (context.canceled)
        {
            animator.SetBool("isWalking", false);
            animator.SetFloat("LastInputX", moveInput.x);
            animator.SetFloat("LastInputY", moveInput.y);
        }

        moveInput = context.ReadValue<Vector2>();
        animator.SetFloat("InputX", moveInput.x);
        animator.SetFloat("InputY", moveInput.y);
    }
}
