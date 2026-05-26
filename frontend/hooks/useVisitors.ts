"use client"
import { useState, useEffect, useCallback } from "react"
import { visitorsApi } from "@/lib/api"
import { Visitor } from "@/types"

export function useVisitors(initialFilters: Record<string, string> = {}) {
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState(initialFilters)

  const fetchVisitors = useCallback(async (f = filters) => {
    setLoading(true)
    setError(null)
    try {
      const res = await visitorsApi.list(f)
      setVisitors(res.data)
    } catch {
      setError("Failed to load visitors")
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchVisitors() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const checkIn = async (data: object) => {
    const res = await visitorsApi.create(data)
    setVisitors((prev) => [res.data, ...prev])
    return res.data
  }

  const checkOut = async (id: number) => {
    await visitorsApi.checkout(id)
    setVisitors((prev) =>
      prev.map((v) => v.id === id ? { ...v, status: "checked_out" as const, check_out: new Date().toISOString() } : v)
    )
  }

  const deleteVisitor = async (id: number) => {
    setVisitors((prev) => prev.filter((v) => v.id !== id))
  }

  const applyFilters = (newFilters: Record<string, string>) => {
    setFilters(newFilters)
    fetchVisitors(newFilters)
  }

  return { visitors, loading, error, checkIn, checkOut, deleteVisitor, applyFilters, refetch: fetchVisitors }
}
