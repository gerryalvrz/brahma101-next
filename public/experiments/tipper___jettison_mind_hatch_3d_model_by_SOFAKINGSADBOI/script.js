document.addEventListener('DOMContentLoaded', () => {
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const iframe = document.querySelector('.model-container iframe');
    const toggleAudioBtn = document.getElementById('toggle-audio');
    
    // Initialize SoundCloud Widget
    let scWidget;
    const soundcloudFrame = document.querySelector('.audio-container iframe');
    if (soundcloudFrame) {
        scWidget = SC.Widget(soundcloudFrame);
    }
    
    // Fullscreen functionality
    fullscreenBtn.addEventListener('click', () => {
        if (iframe.requestFullscreen) {
            iframe.requestFullscreen();
        } else if (iframe.webkitRequestFullscreen) { /* Safari */
            iframe.webkitRequestFullscreen();
        } else if (iframe.msRequestFullscreen) { /* IE11 */
            iframe.msRequestFullscreen();
        }
    });
    
    // Audio toggle functionality
    if (toggleAudioBtn && scWidget) {
        toggleAudioBtn.addEventListener('click', () => {
            scWidget.toggle();
            toggleAudioBtn.textContent = toggleAudioBtn.textContent === 'Pause Audio' ? 'Play Audio' : 'Pause Audio';
        });
    }
    
    // Add a subtle pulsing animation to the fullscreen button
    setTimeout(() => {
        fullscreenBtn.classList.add('pulse');
    }, 3000);
    
    // For accessibility
    iframe.setAttribute('title', 'Tipper - Jettison Mind Hatch 3D Model');
    
    // Handle iframe loading errors
    iframe.addEventListener('error', (error) => {
        console.error('Error loading 3D model:', error);
        document.getElementById('error-message').style.display = 'block';
    });
    
    // Handle SoundCloud widget errors
    if (scWidget) {
        scWidget.bind(SC.Widget.Events.ERROR, () => {
            console.error('Error loading SoundCloud widget');
            if (toggleAudioBtn) {
                toggleAudioBtn.style.display = 'none';
            }
        });
    }
    
    console.log('3D Model Viewer initialized');
});