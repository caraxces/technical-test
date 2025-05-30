class FacetFiltersForm extends HTMLElement {
  constructor() {
    super()
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this)

    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event)
    }, 500)

    const facetForm = this.querySelector("form")
    facetForm.addEventListener("input", this.debouncedOnSubmit.bind(this))

    const facetWrapper = this.querySelector("#FacetsWrapperDesktop")
    if (facetWrapper) facetWrapper.addEventListener("keyup", onKeyUpEscape)
  }

  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial
      if (searchParams === FacetFiltersForm.searchParamsPrev) return
      FacetFiltersForm.renderPage(searchParams, null, false)
    }
    window.addEventListener("popstate", onHistoryChange)
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams
    const sections = FacetFiltersForm.getSections()
    const countContainer = document.getElementById("ProductCount")
    const countContainerDesktop = document.getElementById("ProductCountDesktop")

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`
      const filterDataUrl = (element) => element.url === url

      FacetFiltersForm.filterData.some(filterDataUrl)
        ? FacetFiltersForm.renderSectionFromCache(filterDataUrl, event)
        : FacetFiltersForm.renderSectionFromFetch(url, event)
    })

    if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams)
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then((response) => response.text())
      .then((responseText) => {
        const html = responseText
        FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }]
        FacetFiltersForm.renderFilters(html, event)
        FacetFiltersForm.renderProductGridContainer(html)
        FacetFiltersForm.renderProductCount(html)
      })
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html
    FacetFiltersForm.renderFilters(html, event)
    FacetFiltersForm.renderProductGridContainer(html)
    FacetFiltersForm.renderProductCount(html)
  }

  static renderProductGridContainer(html) {
    const productGrid = document.getElementById("ProductGridContainer")
    if (productGrid) {
      productGrid.innerHTML = new DOMParser().parseFromString(html, "text/html").getElementById("ProductGridContainer").innerHTML
    }
  }

  static renderProductCount(html) {
    const parsedHTML = new DOMParser().parseFromString(html, "text/html")
    const newCount = parsedHTML.getElementById("ProductCount")

    if (newCount) {
      const count = newCount.innerHTML
      const container = document.getElementById("ProductCount")
      const containerDesktop = document.getElementById("ProductCountDesktop")

      if (container) container.innerHTML = count
      if (containerDesktop) containerDesktop.innerHTML = count
    }
  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, "text/html")
    const facetDetailsElements = parsedHTML.querySelectorAll("#FacetFiltersForm .js-filter")
    const facetDetailsElementsFromDom = document.querySelectorAll("#FacetFiltersForm .js-filter")

    facetDetailsElements.forEach((elementToRender) => {
      const currentElement = document.getElementById(elementToRender.id)
      if (currentElement) {
        currentElement.innerHTML = elementToRender.innerHTML
      }
    })

    FacetFiltersForm.renderActiveFacets(parsedHTML)
  }

  static renderActiveFacets(html) {
    const activeFacetElementSelectors = [".active-facets-desktop"]
    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector)
      const currentElement = document.querySelector(selector)
      if (activeFacetsElement && currentElement) {
        currentElement.innerHTML = activeFacetsElement.innerHTML
      }
    })
  }

  static updateURLHash(searchParams) {
    history.pushState({ searchParams }, "", `${window.location.pathname}${searchParams && "?".concat(searchParams)}`)
  }

  static getSections() {
    return [
      {
        section: document.getElementById("product-grid").dataset.id,
      },
    ]
  }

  createSearchParams(form) {
    const formData = new FormData(form)
    return new URLSearchParams(formData).toString()
  }

  onSubmitForm(searchParams, event) {
    FacetFiltersForm.renderPage(searchParams, event)
  }

  onSubmitHandler(event) {
    event.preventDefault()
    const searchParams = this.createSearchParams(event.target.closest("form"))
    this.onSubmitForm(searchParams, event)
  }

  onActiveFilterClick(event) {
    event.preventDefault()
    const url = event.currentTarget.href.indexOf("?") == -1 ? "" : event.currentTarget.href.slice(event.currentTarget.href.indexOf("?") + 1)
    FacetFiltersForm.renderPage(url)
  }
}

class PriceRange extends HTMLElement {
  constructor() {
    super()
    this.querySelectorAll("input").forEach((element) => {
      element.addEventListener("change", this.onRangeChange.bind(this))
    })
    this.setMinAndMaxValues()
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget)
    this.setMinAndMaxValues()
  }

  setMinAndMaxValues() {
    const inputs = this.querySelectorAll("input")
    const minInput = inputs[0]
    const maxInput = inputs[1]

    if (maxInput && maxInput.value) minInput.setAttribute("data-max", maxInput.value)
    if (minInput && minInput.value) maxInput.setAttribute("data-min", minInput.value)
    if (minInput && minInput.value === "") maxInput.setAttribute("data-min", 0)
    if (maxInput && maxInput.value === "") minInput.setAttribute("data-max", minInput.getAttribute("data-max"))
  }

  adjustToValidValues(input) {
    const value = Number(input.value)
    const min = Number(input.getAttribute("data-min"))
    const max = Number(input.getAttribute("data-max"))

    if (value < min) input.value = min
    if (value > max) input.value = max
  }
}

class FacetRemove extends HTMLElement {
  constructor() {
    super()
    const facetLink = this.querySelector("a")
    if (facetLink) {
      facetLink.setAttribute("role", "button")
      facetLink.addEventListener("click", this.closeFilter.bind(this))
      facetLink.addEventListener("keyup", (event) => {
        event.preventDefault()
        if (event.code.toUpperCase() === "SPACE") this.closeFilter(event)
      })
    }
  }

  closeFilter(event) {
    event.preventDefault()
    const form = this.closest("facet-filters-form") || document.querySelector("facet-filters-form")
    if (form) {
      form.onActiveFilterClick(event)
    }
  }
}

// Initialize
FacetFiltersForm.filterData = []
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1)
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1)

customElements.define("facet-filters-form", FacetFiltersForm)
customElements.define("price-range", PriceRange)
customElements.define("facet-remove", FacetRemove)

FacetFiltersForm.setListeners()

// Utility functions
function debounce(func, wait, immediate) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func(...args)
  }
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() === "ESCAPE") {
    const openDetailsElement = event.target.closest("details[open]")
    if (openDetailsElement) {
      openDetailsElement.removeAttribute("open")
      openDetailsElement.querySelector("summary").focus()
    }
  }
}
