document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('userInput');
    
    if (textarea) {
        function resetTextareaHeight() {
            const screenWidth = window.innerWidth;
            
            if (screenWidth <= 480) {
                textarea.style.height = '45px';
                textarea.style.minHeight = '45px';
                textarea.style.maxHeight = '45px';
            } else if (screenWidth <= 768) {
                textarea.style.height = '50px';
                textarea.style.minHeight = '50px';
                textarea.style.maxHeight = '50px';
            } else {
                textarea.style.height = '50px';
                textarea.style.minHeight = '50px';
                textarea.style.maxHeight = '50px';
            }
            
            textarea.style.overflowY = 'auto';
            textarea.style.resize = 'none';
        }
        
        resetTextareaHeight();
        
        textarea.addEventListener('input', function(e) {
            resetTextareaHeight();
        });
        
        textarea.addEventListener('keyup', function(e) {
            resetTextareaHeight();
        });
        
        textarea.addEventListener('change', function(e) {
            resetTextareaHeight();
        });
        
        window.addEventListener('resize', function() {
            resetTextareaHeight();
        });
        
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const currentHeight = textarea.style.height;
                    const screenWidth = window.innerWidth;
                    const expectedHeight = screenWidth <= 480 ? '45px' : '50px';
                    
                    if (currentHeight !== expectedHeight) {
                        resetTextareaHeight();
                    }
                }
            });
        });
        
        observer.observe(textarea, {
            attributes: true,
            attributeFilter: ['style']
        });
    }
});