// app/workspace/_components/ClerkWatermarkRemover.jsx
"use client";
import { useEffect } from 'react';

export default function ClerkWatermarkRemover() {
  useEffect(() => {
    const removeClerkWatermark = () => {
      // Find and hide Clerk footer elements
      const selectors = [
        '.cl-userButtonPopoverFooter',
        '[class*="userButtonPopoverFooter"]',
        '[class*="footer"]',
        'footer'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent || '';
          if (text.includes('Secured by') || 
              text.includes('Development mode') || 
              text.includes('Clerk') ||
              el.classList.toString().includes('footer')) {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.height = '0';
            el.style.padding = '0';
            el.style.margin = '0';
            el.style.overflow = 'hidden';
          }
        });
      });

      // Also check for text nodes containing the watermark text
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent || '';
        if (text.includes('Secured by Clerk') || 
            text.includes('Development mode')) {
          const parent = node.parentElement;
          if (parent) {
            parent.style.display = 'none';
            parent.style.visibility = 'hidden';
          }
        }
      }
    };

    // Run immediately
    removeClerkWatermark();

    // Set up observer to catch dynamically added elements
    const observer = new MutationObserver(() => {
      removeClerkWatermark();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also run on interval as backup
    const interval = setInterval(removeClerkWatermark, 500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}

