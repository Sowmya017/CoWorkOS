"use client"
import { useState, useEffect, useCallback } from "react"

interface UseApiOptions<T> {
  initialData?: T
  immediate?: boolean
}

interface UseApiReturn<T> {
  data: T | undefined
  loading: boolean
  error: string | null
  execute: (...args: unknown[]) => Promise<T | undefined>
  setData: (data: T) => void
  reset: () => void
}

export function useApi<T>(
  apiFn: (...args: unknown[]) => Promise<{ data: T }>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const { initialData, immediate = false } = options
  const [data, setData] = useState<T | undefined>(initialData)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (...args: unknown[]) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn(...args)
      setData(res.data)
      return res.data
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail || "Something went wrong"
      setError(message)
      return undefined
    } finally {
      setLoading(false)
    }
  }, [apiFn])

  useEffect(() => {
    if (immediate) execute()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const reset = useCallback(() => {
    setData(initialData)
    setError(null)
    setLoading(false)
  }, [initialData])

  return { data, loading, error, execute, setData, reset }
}

// Paginated data hook
export function usePaginatedApi<T>(
  apiFn: (params: Record<string, unknown>) => Promise<{ data: T[] }>,
  pageSize = 10
) {
  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Record<string, unknown>>({})

  const fetch = useCallback(async (p = page, f = filters) => {
    setLoading(true)
    try {
      const res = await apiFn({ ...f, page: p, page_size: pageSize })
      // Support both array and paginated responses
      const d = Array.isArray(res.data) ? res.data : (res.data as unknown as { items: T[]; total: number }).items || []
      const t = Array.isArray(res.data) ? res.data.length : (res.data as unknown as { total: number }).total || d.length
      setItems(d)
      setTotal(t)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [apiFn, page, filters, pageSize])

  useEffect(() => { fetch(page, filters) }, [page, filters]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateFilters = (newFilters: Record<string, unknown>) => {
    setPage(1)
    setFilters(newFilters)
  }

  return {
    items,
    page,
    total,
    totalPages: Math.ceil(total / pageSize),
    pageSize,
    loading,
    filters,
    setPage,
    updateFilters,
    refetch: () => fetch(page, filters),
  }
}
