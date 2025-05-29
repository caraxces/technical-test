class CustomFilters {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Bind click events to custom filter links
    document.addEventListener('click', (event) => {
      const filterLink = event.target.closest('.custom-filters__link');
      if (filterLink) {
        event.preventDefault();
        this.handleFilterClick(filterLink);
      }
    });
  }

  handleFilterClick(filterLink) {
    const filterType = filterLink.dataset.filterType;
    const filterValue = filterLink.dataset.filterValue;
    const isActive = filterLink.classList.contains('custom-filters__link--active');
    
    // Show loading state
    this.showLoading();
    
    // Get current URL and build new URL
    const currentUrl = new URL(window.location);
    const searchParams = new URLSearchParams(currentUrl.search);
    
    if (isActive) {
      // Remove filter
      if (filterType === 'product_type') {
        searchParams.delete('filter.p.product_type');
      } else if (filterType === 'product_tag') {
        searchParams.delete('filter.p.tag');
      }
    } else {
      // Add filter
      if (filterType === 'product_type') {
        searchParams.set('filter.p.product_type', filterValue);
      } else if (filterType === 'product_tag') {
        searchParams.set('filter.p.tag', filterValue);
      }
    }
    
    // Build new URL
    const newUrl = `${currentUrl.pathname}?${searchParams.toString()}`;
    
    // Update browser history
    window.history.pushState({}, '', newUrl);
    
    // Fetch new content
    this.fetchFilteredContent(newUrl);
  }

  async fetchFilteredContent(url) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Update product grid
      const newProductGrid = doc.querySelector('#product-grid');
      const currentProductGrid = document.querySelector('#product-grid');
      if (newProductGrid && currentProductGrid) {
        currentProductGrid.innerHTML = newProductGrid.innerHTML;
      }
      
      // Update custom filters
      const newCustomFilters = doc.querySelector('.custom-filters');
      const currentCustomFilters = document.querySelector('.custom-filters');
      if (newCustomFilters && currentCustomFilters) {
        currentCustomFilters.innerHTML = newCustomFilters.innerHTML;
      }
      
      // Update product count
      const newProductCount = doc.querySelector('#ProductCountDesktop, #ProductCount');
      const currentProductCount = document.querySelector('#ProductCountDesktop, #ProductCount');
      if (newProductCount && currentProductCount) {
        currentProductCount.innerHTML = newProductCount.innerHTML;
      }
      
      // Update pagination
      const newPagination = doc.querySelector('.pagination');
      const currentPagination = document.querySelector('.pagination');
      if (newPagination && currentPagination) {
        currentPagination.innerHTML = newPagination.innerHTML;
      } else if (!newPagination && currentPagination) {
        currentPagination.remove();
      }
      
      // Hide loading state
      this.hideLoading();
      
      // Trigger custom event for other scripts
      document.dispatchEvent(new CustomEvent('custom-filters:updated'));
      
    } catch (error) {
      console.error('Error fetching filtered content:', error);
      this.hideLoading();
      // Fallback to page reload
      window.location.href = url;
    }
  }

  showLoading() {
    const productGrid = document.querySelector('#product-grid');
    const loadingOverlay = document.querySelector('.loading-overlay');
    
    if (productGrid) {
      productGrid.style.opacity = '0.5';
      productGrid.style.pointerEvents = 'none';
    }
    
    if (loadingOverlay) {
      loadingOverlay.style.display = 'block';
    }
  }

  hideLoading() {
    const productGrid = document.querySelector('#product-grid');
    const loadingOverlay = document.querySelector('.loading-overlay');
    
    if (productGrid) {
      productGrid.style.opacity = '1';
      productGrid.style.pointerEvents = 'auto';
    }
    
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CustomFilters();
});

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
  window.location.reload();
}); 