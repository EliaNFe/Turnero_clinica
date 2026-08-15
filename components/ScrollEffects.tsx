'use client'

import { useEffect } from 'react'

export default function ScrollEffects() {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('js-motion')
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'))
      return () => root.classList.remove('js-motion')
    }

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' },
    )
    elements.forEach((element) => observer.observe(element))
    return () => {
      observer.disconnect()
      root.classList.remove('js-motion')
    }
  }, [])

  return null
}
