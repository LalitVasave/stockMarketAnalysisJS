document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    handleRoute();

    // Listen to hash changes
    window.addEventListener('hashchange', handleRoute);

    // Setup click handlers to update hash
    document.querySelectorAll('[data-route]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const route = e.currentTarget.getAttribute('data-route');
            window.location.hash = route;
        });
    });
});

function handleRoute() {
    const hash = window.location.hash || '#registration';
    const routeId = hash.substring(1);
    navigateTo(routeId);
}

function navigateTo(routeId) {
    // Try to find the target view
    const targetView = document.getElementById(`view-${routeId}`);
    if (!targetView) {
        console.warn(`Route ${routeId} not found, defaulting back to registration.`);
        return navigateTo('registration');
    }

    // Hide all views
    document.querySelectorAll('.view-container').forEach(view => {
        view.classList.remove('active');
    });

    // Show selected view
    targetView.classList.add('active');

    // Update active state in sidebars (if applicable for dashboard/etc)
    document.querySelectorAll('[data-route]').forEach(link => {
        if (link.getAttribute('data-route') === routeId) {
            link.classList.add('text-white', 'bg-white/5');
            link.classList.remove('text-slate-muted');
        } else {
            link.classList.remove('text-white', 'bg-white/5');
            link.classList.add('text-slate-muted');
        }
    });
}
