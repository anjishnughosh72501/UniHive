/**
 * 404 Not Found View
 */

export function renderNotFound(params, container) {
  container.innerHTML = `
    <div class="card-brut" style="text-align: center; padding: 4rem 2rem; max-width: 600px; margin: 2rem auto;">
      <div style="font-size: 3.5rem; margin-bottom: 1rem;">🚫</div>
      <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">Page Not Found</h1>
      <p style="color: var(--color-muted); margin-bottom: 2rem;">
        The requested campus route does not exist or has been relocated.
      </p>
      <a href="#/" class="btn-brut btn-primary">Return to Equipment Locker →</a>
    </div>
  `;
}
