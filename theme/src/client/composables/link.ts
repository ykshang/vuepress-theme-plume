import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { isLinkExternal, isLinkWithProtocol } from '@vuepress/helper/client'
import { computed, toValue } from 'vue'
import { resolveRouteFullPath, useRoute } from 'vuepress/client'
import { useData } from './data.js'

interface UseLinkResult {
  /**
   * 外部链接
   */
  isExternal: ComputedRef<boolean>
  /**
   * 外部链接协议
   * 此项不包含 target="_blank" 的情况
   */
  isExternalProtocol: ComputedRef<boolean>
  link: ComputedRef<string | undefined>
}

export function useLink(
  href: MaybeRefOrGetter<string | undefined>,
  target?: MaybeRefOrGetter<string | undefined>,
): UseLinkResult {
  const route = useRoute()
  const { page } = useData()

  const isExternal = computed(() => {
    const link = toValue(href)
    const rawTarget = toValue(target)
    if (!link)
      return false
    if (rawTarget === '_blank' || isLinkExternal(link))
      return true
    const filename = link.split(/[#?]/)[0]?.split('/').pop() || ''
    if (filename === '' || filename.endsWith('.html') || filename.endsWith('.md'))
      return false
    return filename.includes('.')
  })

  const link = computed(() => {
    const link = toValue(href)
    if (!link)
      return undefined
    if (isExternal.value)
      return link

    const currentPath = page.value.filePathRelative ? `/${page.value.filePathRelative}` : undefined
    const path = resolveRouteFullPath(link, currentPath)
    if (path.includes('#')) {
      if (path.slice(0, path.indexOf('#')) === route.path) {
        return path.slice(path.indexOf('#'))
      }
    }
    return path
  })

  const isExternalProtocol = computed(() => {
    if (!link.value || link.value[0] === '#')
      return false

    return isLinkWithProtocol(link.value)
  })

  return { isExternal, isExternalProtocol, link }
}
