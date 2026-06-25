import { describe, it, expect, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { ReactElement } from 'react'
import { MountSelector } from './MountSelector'
import type { MountOption } from '../data/types'

const MOUNTS: MountOption[] = [
  { id: 'mount-cold-one', name: 'Cold One', points: 10 },
  { id: 'mount-dark-steed', name: 'Dark Steed', points: 3 },
]

let container: HTMLDivElement
let root: Root

function render(ui: ReactElement) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(ui))
}

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('MountSelector', () => {
  it('renders On foot plus one radio per mount', () => {
    render(<MountSelector mounts={MOUNTS} selectedId={undefined} onSelect={() => {}} lang="en" name="e1" />)
    expect(container.querySelectorAll('input[type="radio"]').length).toBe(3)
  })

  it('marks the selected mount as checked', () => {
    render(<MountSelector mounts={MOUNTS} selectedId="mount-cold-one" onSelect={() => {}} lang="en" name="e1" />)
    const checked = container.querySelector('input[type="radio"]:checked') as HTMLInputElement
    expect(checked.closest('label')?.textContent).toContain('Cold One')
  })

  it('calls onSelect with the mount id when a mount chip is chosen', () => {
    let picked: string | null | undefined = '__unset__'
    render(<MountSelector mounts={MOUNTS} selectedId={undefined} onSelect={(id) => { picked = id }} lang="en" name="e1" />)
    const radios = Array.from(container.querySelectorAll('input[type="radio"]')) as HTMLInputElement[]
    act(() => radios[1].click())
    expect(picked).toBe('mount-cold-one')
  })

  it('calls onSelect with null when On foot is chosen', () => {
    let picked: string | null | undefined = '__unset__'
    render(<MountSelector mounts={MOUNTS} selectedId="mount-cold-one" onSelect={(id) => { picked = id }} lang="en" name="e1" />)
    const radios = Array.from(container.querySelectorAll('input[type="radio"]')) as HTMLInputElement[]
    act(() => radios[0].click())
    expect(picked).toBe(null)
  })
})
