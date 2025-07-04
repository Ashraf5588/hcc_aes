// Navigation menu functionality
document.addEventListener('DOMContentLoaded', function() {
  const navbarToggler = document.querySelector('.navbar-toggler');
  const navbarLinks = document.querySelector('.navbar-links');
  
  if (navbarToggler) {
    navbarToggler.addEventListener('click', function() {
      navbarLinks.classList.toggle('show');
      
      // Update aria-expanded attribute
      const isExpanded = navbarLinks.classList.contains('show');
      navbarToggler.setAttribute('aria-expanded', isExpanded);
    });
  }
  
  // Close the menu when clicking outside
  document.addEventListener('click', function(event) {
    if (
      navbarLinks && 
      navbarLinks.classList.contains('show') && 
      !event.target.closest('.navbar-links') && 
      !event.target.closest('.navbar-toggler')
    ) {
      navbarLinks.classList.remove('show');
      navbarToggler.setAttribute('aria-expanded', 'false');
    }
  });
  
  // Add animation effects to nav items
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((item, index) => {
    item.style.animation = `fadeInDown 0.3s ease forwards ${0.1 + index * 0.1}s`;
    item.style.opacity = '0';
  });
  
  // Add keyframe animation
  if (!document.querySelector('#nav-animations')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'nav-animations';
    styleSheet.innerHTML = `
      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }
});
