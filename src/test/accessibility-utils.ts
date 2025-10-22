import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * Accessibility testing utilities for the speech timer application
 */

/**
 * Test keyboard navigation through a list of elements
 */
export const testKeyboardNavigation = async (elements: HTMLElement[]) => {
  const user = userEvent.setup()
  
  // Focus first element
  elements[0].focus()
  expect(document.activeElement).toBe(elements[0])
  
  // Tab through elements
  for (let i = 1; i < elements.length; i++) {
    await user.tab()
    expect(document.activeElement).toBe(elements[i])
  }
  
  // Shift+Tab back through elements
  for (let i = elements.length - 2; i >= 0; i--) {
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(elements[i])
  }
}

/**
 * Test that an element has proper ARIA attributes
 */
export const testAriaAttributes = (element: HTMLElement, expectedAttributes: Record<string, string>) => {
  Object.entries(expectedAttributes).forEach(([attribute, expectedValue]) => {
    expect(element).toHaveAttribute(attribute, expectedValue)
  })
}

/**
 * Test that interactive elements have minimum tap target size
 */
export const testTapTargetSize = (element: HTMLElement, minSize = 44) => {
  const rect = element.getBoundingClientRect()
  expect(rect.width).toBeGreaterThanOrEqual(minSize)
  expect(rect.height).toBeGreaterThanOrEqual(minSize)
}

/**
 * Test color contrast ratios (simplified check for common patterns)
 */
export const testColorContrast = (element: HTMLElement) => {
  const computedStyle = window.getComputedStyle(element)
  const backgroundColor = computedStyle.backgroundColor
  const color = computedStyle.color
  
  // Basic check - ensure colors are not the same
  expect(backgroundColor).not.toBe(color)
  
  // Check for transparent backgrounds on text elements
  if (element.tagName === 'SPAN' || element.tagName === 'P' || element.tagName === 'DIV') {
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  }
}

/**
 * Test that form elements have proper labels
 */
export const testFormLabeling = (input: HTMLElement) => {
  // Check for aria-label
  const ariaLabel = input.getAttribute('aria-label')
  
  // Check for aria-labelledby
  const ariaLabelledBy = input.getAttribute('aria-labelledby')
  
  // Check for associated label element
  const id = input.getAttribute('id')
  let hasLabel = false
  
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`)
    hasLabel = !!label
  }
  
  // At least one labeling method should be present
  expect(ariaLabel || ariaLabelledBy || hasLabel).toBeTruthy()
}

/**
 * Test skip links functionality
 */
export const testSkipLinks = async () => {
  const user = userEvent.setup()
  
  // Look for skip links (they should be hidden by default)
  const skipLinks = screen.queryAllByText(/スキップ/)
  
  if (skipLinks.length > 0) {
    // Focus the first skip link
    skipLinks[0].focus()
    
    // It should become visible when focused
    expect(skipLinks[0]).toHaveClass('focus:not-sr-only')
    
    // Test activation
    await user.keyboard('{Enter}')
    
    // The target should be focused (we can't easily test this without knowing the target)
    // But we can at least ensure the skip link exists and is focusable
    expect(skipLinks[0]).toBeInTheDocument()
  }
}

/**
 * Test screen reader announcements
 */
export const testLiveRegions = () => {
  // Check for aria-live regions
  const politeRegions = screen.queryAllByRole('status')
  const assertiveRegions = screen.queryAllByRole('alert')
  
  // Ensure live regions exist
  expect(politeRegions.length + assertiveRegions.length).toBeGreaterThan(0)
  
  // Check attributes
  politeRegions.forEach(region => {
    expect(region).toHaveAttribute('aria-live', 'polite')
  })
  
  assertiveRegions.forEach(region => {
    expect(region).toHaveAttribute('aria-live', 'assertive')
  })
}

/**
 * Test heading hierarchy
 */
export const testHeadingHierarchy = () => {
  const headings = screen.queryAllByRole('heading')
  
  if (headings.length === 0) return
  
  // Get heading levels
  const levels = headings.map(heading => {
    const tagName = heading.tagName.toLowerCase()
    return parseInt(tagName.replace('h', ''), 10)
  })
  
  // Check that we start with h1
  expect(levels[0]).toBe(1)
  
  // Check that levels don't skip (no h1 -> h3 without h2)
  for (let i = 1; i < levels.length; i++) {
    const currentLevel = levels[i]
    const previousLevel = levels[i - 1]
    
    // Level can stay same, go up by 1, or go down any amount
    expect(currentLevel - previousLevel).toBeLessThanOrEqual(1)
  }
}

/**
 * Test focus management
 */
export const testFocusManagement = async (triggerElement: HTMLElement, expectedFocusTarget?: HTMLElement) => {
  const user = userEvent.setup()
  
  // Focus the trigger element
  triggerElement.focus()
  expect(document.activeElement).toBe(triggerElement)
  
  // Activate it
  await user.keyboard('{Enter}')
  
  // If expected target is provided, check focus moved there
  if (expectedFocusTarget) {
    expect(document.activeElement).toBe(expectedFocusTarget)
  }
  
  // Ensure focus is visible
  const focusedElement = document.activeElement as HTMLElement
  if (focusedElement) {
    const computedStyle = window.getComputedStyle(focusedElement)
    // Check for focus ring (outline or box-shadow)
    expect(
      computedStyle.outline !== 'none' || 
      computedStyle.boxShadow !== 'none'
    ).toBeTruthy()
  }
}

/**
 * Comprehensive accessibility audit for a component
 */
export const auditAccessibility = async (container: HTMLElement) => {
  // Test heading hierarchy
  testHeadingHierarchy()
  
  // Test live regions
  testLiveRegions()
  
  // Test interactive elements
  const buttons = container.querySelectorAll('button')
  const inputs = container.querySelectorAll('input')
  const links = container.querySelectorAll('a')
  
  // Test buttons
  buttons.forEach(button => {
    testFormLabeling(button)
    testTapTargetSize(button)
  })
  
  // Test inputs
  inputs.forEach(input => {
    testFormLabeling(input)
  })
  
  // Test links
  links.forEach(link => {
    testFormLabeling(link)
  })
  
  // Test skip links
  await testSkipLinks()
}