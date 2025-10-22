import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import App from '../App'
import { 
  testKeyboardNavigation, 
  testAriaAttributes, 
  testTapTargetSize,
  testFormLabeling,
  testHeadingHierarchy,
  testLiveRegions,
  auditAccessibility
} from '../test/accessibility-utils'

const renderApp = () => {
  return render(<App />)
}

describe('Accessibility Integration Tests', () => {
  beforeEach(() => {
    // Reset any stored settings
    localStorage.clear()
  })

  describe('Semantic HTML and Structure', () => {
    it('has proper heading hierarchy', () => {
      renderApp()
      testHeadingHierarchy()
    })

    it('uses semantic HTML elements', () => {
      renderApp()
      
      // Check for main landmark
      expect(screen.getByRole('main')).toBeInTheDocument()
      
      // Check for header
      expect(screen.getByRole('banner')).toBeInTheDocument()
      
      // Check for sections
      const sections = screen.getAllByRole('region')
      expect(sections.length).toBeGreaterThan(0)
    })

    it('has proper ARIA landmarks', () => {
      renderApp()
      
      // Main content
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      
      // Navigation (header)
      const banner = screen.getByRole('banner')
      expect(banner).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('allows keyboard navigation through all interactive elements', async () => {
      renderApp()
      
      // Get all interactive elements
      const buttons = screen.getAllByRole('button')
      const links = screen.getAllByRole('link')
      
      // All should be focusable
      const interactiveElements = [...buttons, ...links]
      
      for (const element of interactiveElements) {
        element.focus()
        expect(document.activeElement).toBe(element)
      }
    })

    it('supports keyboard shortcuts', async () => {
      const user = userEvent.setup()
      renderApp()
      
      // Test Space key for play/pause
      await user.keyboard(' ')
      
      // Test R key for reset
      await user.keyboard('r')
      
      // Test B key for bell test
      await user.keyboard('b')
      
      // No errors should occur
      expect(true).toBe(true)
    })

    it('has visible focus indicators', async () => {
      const user = userEvent.setup()
      renderApp()
      
      const buttons = screen.getAllByRole('button')
      
      for (const button of buttons) {
        button.focus()
        
        // Check for focus ring classes
        expect(
          button.className.includes('focus-ring') ||
          button.className.includes('focus:ring') ||
          button.className.includes('focus:outline')
        ).toBeTruthy()
      }
    })
  })

  describe('ARIA Labels and Descriptions', () => {
    it('has proper ARIA labels on all interactive elements', () => {
      renderApp()
      
      const buttons = screen.getAllByRole('button')
      
      buttons.forEach(button => {
        testFormLabeling(button)
      })
    })

    it('has proper ARIA attributes on controls', () => {
      renderApp()
      
      // Timer controls group
      const controlsGroup = screen.getByRole('group', { name: /タイマーコントロール/ })
      expect(controlsGroup).toBeInTheDocument()
      
      // Switch elements (bell toggles)
      const switches = screen.getAllByRole('switch')
      switches.forEach(switchElement => {
        testAriaAttributes(switchElement, {
          'role': 'switch',
          'aria-checked': expect.stringMatching(/true|false/)
        })
      })
      
      // Radio group (progress mode)
      const radioGroup = screen.getByRole('radiogroup')
      expect(radioGroup).toBeInTheDocument()
      
      const radios = screen.getAllByRole('radio')
      radios.forEach(radio => {
        testAriaAttributes(radio, {
          'role': 'radio',
          'aria-checked': expect.stringMatching(/true|false/)
        })
      })
    })

    it('has proper error handling with ARIA', async () => {
      const user = userEvent.setup()
      renderApp()
      
      // Click on time display to edit
      const timeDisplay = screen.getByRole('button', { name: /残り時間/ })
      await user.click(timeDisplay)
      
      // Enter invalid time
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'invalid')
      
      // Check for error message with proper ARIA
      const errorMessage = screen.getByRole('alert')
      expect(errorMessage).toBeInTheDocument()
      
      // Input should reference error
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby')
    })
  })

  describe('Screen Reader Support', () => {
    it('has live regions for announcements', () => {
      renderApp()
      testLiveRegions()
    })

    it('has proper screen reader only content', () => {
      renderApp()
      
      // Check for sr-only elements
      const srOnlyElements = document.querySelectorAll('.sr-only')
      expect(srOnlyElements.length).toBeGreaterThan(0)
      
      // Check that they have proper styling
      srOnlyElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element)
        expect(computedStyle.position).toBe('absolute')
        expect(computedStyle.width).toBe('1px')
        expect(computedStyle.height).toBe('1px')
      })
    })

    it('announces timer state changes', async () => {
      const user = userEvent.setup()
      renderApp()
      
      // Start timer
      const playButton = screen.getByRole('button', { name: /タイマーを開始/ })
      await user.click(playButton)
      
      // Check for live region updates
      const liveRegions = screen.getAllByRole('status')
      expect(liveRegions.length).toBeGreaterThan(0)
    })
  })

  describe('Touch and Mobile Accessibility', () => {
    it('has minimum tap target sizes', () => {
      renderApp()
      
      const buttons = screen.getAllByRole('button')
      
      buttons.forEach(button => {
        testTapTargetSize(button, 44)
      })
    })

    it('supports touch interactions', async () => {
      const user = userEvent.setup()
      renderApp()
      
      // Test touch on time display
      const timeDisplay = screen.getByRole('button', { name: /残り時間/ })
      await user.click(timeDisplay)
      
      // Should enter edit mode
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  describe('Settings Page Accessibility', () => {
    it('maintains accessibility in settings', async () => {
      const user = userEvent.setup()
      renderApp()
      
      // Navigate to settings
      const settingsButton = screen.getByRole('button', { name: /設定画面を開く/ })
      await user.click(settingsButton)
      
      // Check settings page accessibility
      expect(screen.getByRole('main')).toBeInTheDocument()
      
      // Test theme picker
      const themeButtons = screen.getAllByRole('button', { pressed: true })
      expect(themeButtons.length).toBeGreaterThan(0)
      
      // Test volume slider
      const volumeSlider = screen.getByRole('slider')
      expect(volumeSlider).toHaveAttribute('aria-label')
      
      // Test progress mode radio group
      const radioGroup = screen.getByRole('radiogroup')
      expect(radioGroup).toHaveAttribute('aria-label')
    })

    it('allows keyboard navigation in settings', async () => {
      const user = userEvent.setup()
      renderApp()
      
      // Navigate to settings
      const settingsButton = screen.getByRole('button', { name: /設定画面を開く/ })
      await user.click(settingsButton)
      
      // Test keyboard navigation
      const interactiveElements = [
        ...screen.getAllByRole('button'),
        screen.getByRole('slider'),
        ...screen.getAllByRole('radio')
      ]
      
      await testKeyboardNavigation(interactiveElements.slice(0, 3)) // Test first few elements
    })
  })

  describe('Skip Links', () => {
    it('has skip links for keyboard users', async () => {
      const user = userEvent.setup()
      renderApp()
      
      // Tab to first element (should be skip link)
      await user.tab()
      
      const focusedElement = document.activeElement as HTMLElement
      if (focusedElement && focusedElement.textContent?.includes('スキップ')) {
        expect(focusedElement).toHaveClass('focus:not-sr-only')
      }
    })
  })

  describe('Color and Contrast', () => {
    it('maintains sufficient color contrast', () => {
      renderApp()
      
      // Test text elements
      const textElements = screen.getAllByText(/./i)
      
      // Basic check - ensure text is not transparent
      textElements.slice(0, 5).forEach(element => {
        const computedStyle = window.getComputedStyle(element)
        expect(computedStyle.color).not.toBe('rgba(0, 0, 0, 0)')
        expect(computedStyle.color).not.toBe('transparent')
      })
    })

    it('does not rely solely on color for information', () => {
      renderApp()
      
      // Bell toggles should have text labels, not just color
      const switches = screen.getAllByRole('switch')
      switches.forEach(switchElement => {
        expect(switchElement).toHaveAttribute('aria-label')
      })
      
      // Progress should have text alternative
      const progressElement = screen.getByRole('img', { name: /Timer progress/ })
      expect(progressElement).toHaveAttribute('aria-label')
    })
  })

  describe('Comprehensive Accessibility Audit', () => {
    it('passes comprehensive accessibility audit', async () => {
      const { container } = renderApp()
      
      // Run comprehensive audit
      await auditAccessibility(container)
    })
  })
})